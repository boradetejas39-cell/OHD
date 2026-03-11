const EmployeeResponse = require('../models/EmployeeResponse');
const Question = require('../models/Question');
const Section = require('../models/Section');

// Convert rating to numeric value for calculations
const ratingToNumber = (rating) => {
  const map = { A: 5, B: 4, C: 3, D: 2, E: 1 };
  return map[rating];
};

async function calculateQuestionStats(questionId, companyId) {
  const query = { 'answers.questionId': questionId };
  if (companyId) {
    query.companyId = companyId;
  }
1
  const responses = await EmployeeResponse.find(query);
  const ratingCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  responses.forEach(response => {
    const answer = response.answers.find(a => a.questionId.toString() === questionId.toString());
    if (answer && ratingCount.hasOwnProperty(answer.rating)) {
      ratingCount[answer.rating]++;
    }
  });

  const total = responses.length;
  const ratingPercentage = {
    A: total > 0 ? (ratingCount.A / total) * 100 : 0,
    B: total > 0 ? (ratingCount.B / total) * 100 : 0,
    C: total > 0 ? (ratingCount.C / total) * 100 : 0,
    D: total > 0 ? (ratingCount.D / total) * 100 : 0,
    E: total > 0 ? (ratingCount.E / total) * 100 : 0,
  };

  const question = await Question.findById(questionId);
  return {
    questionId: questionId.toString(),
    questionText: question ? question.text : '',
    ratingCount,
    ratingPercentage,
    totalResponses: total,
  };
}

async function calculateSectionStats(sectionId, companyId) {
  const questions = await Question.find({ sectionId }).sort({ order: 1 });
  const questionStats = [];

  for (const question of questions) {
    const stats = await calculateQuestionStats(question._id, companyId);
    questionStats.push(stats);
  }

  let totalScore = 0;
  let totalMaxScore = 0;

  questionStats.forEach(qStats => {
    const qTotal = qStats.totalResponses;
    if (qTotal > 0) {
      const weightedScore = 
        (qStats.ratingCount.A * 5 +
         qStats.ratingCount.B * 4 +
         qStats.ratingCount.C * 3 +
         qStats.ratingCount.D * 2 +
         qStats.ratingCount.E * 1);
      totalScore += weightedScore;
      totalMaxScore += qTotal * 5;
    }
  });

  const sectionPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
  const section = await Section.findById(sectionId);

  return {
    sectionId: sectionId.toString(),
    sectionName: section ? section.name : '',
    questionStats,
    sectionPercentage,
    totalResponses: questionStats.length > 0 ? questionStats[0].totalResponses : 0,
  };
}

async function calculateOverallStats(companyId) {
  const query = companyId ? { companyId } : {};
  const responses = await EmployeeResponse.find(query);
  const sections = await Section.find().sort({ order: 1 });

  const ratingCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  responses.forEach(response => {
    response.answers.forEach(answer => {
      if (ratingCount.hasOwnProperty(answer.rating)) {
        ratingCount[answer.rating]++;
      }
    });
  });

  const totalRatings = Object.values(ratingCount).reduce((a, b) => a + b, 0);
  const ratingDistributionPercentage = {
    A: totalRatings > 0 ? (ratingCount.A / totalRatings) * 100 : 0,
    B: totalRatings > 0 ? (ratingCount.B / totalRatings) * 100 : 0,
    C: totalRatings > 0 ? (ratingCount.C / totalRatings) * 100 : 0,
    D: totalRatings > 0 ? (ratingCount.D / totalRatings) * 100 : 0,
    E: totalRatings > 0 ? (ratingCount.E / totalRatings) * 100 : 0,
  };

  let totalScore = 0;
  let totalMaxScore = 0;

  responses.forEach(response => {
    response.answers.forEach(answer => {
      totalScore += ratingToNumber(answer.rating);
      totalMaxScore += 5;
    });
  });

  const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

  // Calculate best section
  let bestSection = null;
  let bestPercentage = 0;

  for (const section of sections) {
    const sectionStats = await calculateSectionStats(section._id.toString(), companyId);
    if (sectionStats.sectionPercentage > bestPercentage) {
      bestPercentage = sectionStats.sectionPercentage;
      bestSection = {
        sectionId: section._id.toString(),
        sectionName: section.name,
        percentage: sectionStats.sectionPercentage,
      };
    }
  }

  // Generate summary insights
  const summaryInsights = [];
  if (overallPercentage >= 80) {
    summaryInsights.push('Organization health is excellent');
  } else if (overallPercentage >= 60) {
    summaryInsights.push('Organization health is good with room for improvement');
  } else {
    summaryInsights.push('Organization health needs attention');
  }

  const uniqueCompanies = new Set(responses.map(r => r.companyId.toString()));
  
  return {
    overallPercentage,
    ratingDistribution: ratingCount,
    ratingDistributionPercentage,
    bestSection,
    totalResponses: responses.length,
    totalCompanies: uniqueCompanies.size,
    summaryInsights,
  };
}

module.exports = {
  calculateQuestionStats,
  calculateSectionStats,
  calculateOverallStats
};

