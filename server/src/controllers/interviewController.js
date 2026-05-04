const { Interview, Question, Answer } = require('../models');
const evaluationQueue = require('../queues/evaluationQueue');
const { Op } = require('sequelize');

exports.startInterview = async (req, res) => {
  const { role, level, user_id } = req.body;
  try {
    const interview = await Interview.create({ 
      role, 
      level, 
      user_id: user_id || 'anonymous',
      status: 'active',
      current_question_index: 0
    });

    // Fetch first question for the role and difficulty level
    const question = await Question.findOne({
      where: { 
        role, 
        difficulty: level.toLowerCase() === 'beginner' ? 'easy' : 
                    level.toLowerCase() === 'advanced' ? 'hard' : 'medium'
      },
      order: [['id', 'ASC']]
    });

    if (!question) {
      return res.status(404).json({ message: 'No questions found for this role/level.' });
    }

    res.status(201).json({
      interviewId: interview.id,
      firstQuestion: question
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.nextQuestion = async (req, res) => {
  const { interviewId } = req.query;
  try {
    const interview = await Interview.findByPk(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Get last answer score to decide next difficulty
    const lastAnswer = await Answer.findOne({
      where: { interview_id: interviewId },
      order: [['created_at', 'DESC']]
    });

    let nextDifficulty = 'medium';
    if (lastAnswer && lastAnswer.score >= 8) nextDifficulty = 'hard';
    else if (lastAnswer && lastAnswer.score < 5) nextDifficulty = 'easy';

    interview.current_question_index += 1;
    await interview.save();

    // Fetch next question from DB (random or sequential)
    const nextQuestion = await Question.findOne({
      where: { 
        role: interview.role, 
        difficulty: nextDifficulty 
      },
      order: sequelize.literal('random()') // Randomized next question
    });

    if (!nextQuestion) {
      return res.status(200).json({ message: 'No more questions', isCompleted: true });
    }

    res.json(nextQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitAnswer = async (req, res) => {
  const { interviewId, questionId, answer } = req.body;
  try {
    const interview = await Interview.findByPk(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const newAnswer = await Answer.create({
      interview_id: interviewId,
      question_id: questionId,
      answer_text: answer
    });

    // Add to evaluation queue
    await evaluationQueue.add('evaluateAnswer', { answerId: newAnswer.id });

    res.json({ status: 'processing', message: 'Answer submitted and queued for evaluation' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReport = async (req, res) => {
  const { interviewId } = req.query;
  try {
    const answers = await Answer.findAll({
      where: { interview_id: interviewId },
      include: [Question]
    });

    if (answers.length === 0) return res.status(404).json({ message: 'No answers found' });

    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
    const avgScore = totalScore / answers.length;

    let recommendation = 'Reject';
    if (avgScore > 8) recommendation = 'Strong Hire';
    else if (avgScore > 6) recommendation = 'Consider';

    const report = {
      overallScore: avgScore.toFixed(2),
      recommendation,
      details: answers.map(a => ({
        question: a.Question.question_text,
        score: a.score,
        feedback: a.feedback
      }))
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
