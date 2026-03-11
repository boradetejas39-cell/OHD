/**
 * Database Initialization Script
 * 
 * This script initializes the database with:
 * - 5 Pillars
 * - 20 Subsections (4 per pillar)
 * - 100 Questions (5 per subsection)
 * 
 * Run with: node scripts/initDatabase.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// We use relative paths for the models
const Section = require('../models/Section');
const Question = require('../models/Question');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ohd';

// Define pillars with their subsections
const pillars = [
  {
    pillar: 1,
    name: 'LEADERSHIP & STRATEGIC DIRECTION',
    subsections: [
      {
        name: 'Senior Leadership Effectiveness',
        questions: [
          'Senior leadership provides clear direction for the organization.',
          'Leadership communicates long-term objectives effectively.',
          'Leadership decisions reflect sound judgment.',
          'Senior leaders demonstrate integrity in their actions.',
          'I trust senior leadership\'s ability to guide the company successfully.',
        ],
      },
      {
        name: 'Promoter / Founder Leadership Effectiveness',
        questions: [
          'The promoter provides a clear vision for the organization.',
          'The promoter supports professional management practices.',
          'The promoter delegates authority appropriately.',
          'The promoter\'s decisions are fair and merit-based.',
          'I have confidence in the promoter\'s leadership for the future.',
        ],
      },
      {
        name: 'Vision & Strategic Clarity',
        questions: [
          'The organization has a clearly defined long-term strategy.',
          'Organizational goals are aligned across departments.',
          'I understand how my role contributes to company strategy.',
          'Strategic priorities are communicated consistently.',
          'The organization adapts its strategy when required.',
        ],
      },
      {
        name: 'Governance & Integrity',
        questions: [
          'Organizational policies are applied consistently.',
          'Ethical standards are clearly defined and practiced.',
          'There is accountability for policy violations.',
          'Decisions are made in a transparent manner.',
          'The organization promotes fairness and compliance.',
        ],
      },
    ],
  },
  {
    pillar: 2,
    name: 'MANAGEMENT & PEOPLE SYSTEMS',
    subsections: [
      {
        name: 'Immediate Manager Effectiveness',
        questions: [
          'My manager treats me with respect.',
          'My manager listens to my ideas and concerns.',
          'My manager provides constructive feedback.',
          'My manager supports my professional growth.',
          'My manager handles team matters fairly.',
        ],
      },
      {
        name: 'Human Resources Effectiveness',
        questions: [
          'HR is approachable and accessible.',
          'HR handles employee concerns confidentially.',
          'HR policies are clearly communicated.',
          'HR processes are implemented fairly.',
          'HR contributes positively to the employee experience.',
        ],
      },
      {
        name: 'Performance Management System',
        questions: [
          'Performance expectations are clearly defined.',
          'Performance evaluations are fair and objective.',
          'High performance is recognized appropriately.',
          'Underperformance is addressed constructively.',
          'The performance system drives accountability.',
        ],
      },
      {
        name: 'Rewards, Recognition & Fairness',
        questions: [
          'Compensation is fair for my responsibilities.',
          'Benefits provided meet employee needs.',
          'Good work is recognized in a timely manner.',
          'Rewards are distributed transparently.',
          'I feel valued for my contributions.',
        ],
      },
    ],
  },
  {
    pillar: 3,
    name: 'CULTURE & ENGAGEMENT',
    subsections: [
      {
        name: 'Work Environment & Psychological Safety',
        questions: [
          'Employees are treated with dignity and respect.',
          'I feel safe expressing my opinions.',
          'The workplace environment is professional.',
          'Diversity and inclusion are respected.',
          'New ideas are welcomed.',
        ],
      },
      {
        name: 'Employee Engagement & Involvement',
        questions: [
          'The organization conducts meaningful engagement initiatives.',
          'Employees are encouraged to participate in activities.',
          'Employee feedback is considered in decisions.',
          'I feel a sense of belonging in the organization.',
          'Engagement initiatives positively influence morale.',
        ],
      },
      {
        name: 'Work-Life Balance & Leave Management',
        questions: [
          'Leave policies are clearly defined.',
          'Leave approvals are handled fairly.',
          'I can take leave when genuinely required.',
          'My manager respects approved time off.',
          'Work-related stress is manageable.',
        ],
      },
      {
        name: 'Team Collaboration',
        questions: [
          'Team members cooperate effectively.',
          'Information is shared openly within teams.',
          'Conflicts are resolved professionally.',
          'Team members support each other during workload pressure.',
          'There is trust among team members.',
        ],
      },
    ],
  },
  {
    pillar: 4,
    name: 'SYSTEMS & EXECUTION',
    subsections: [
      {
        name: 'Role Clarity & Accountability',
        questions: [
          'My responsibilities are clearly defined.',
          'I understand what is expected of me.',
          'I have the authority needed to perform my role.',
          'My workload is manageable.',
          'Accountability standards are clear.',
        ],
      },
      {
        name: 'Systems, Processes & Operational Efficiency',
        questions: [
          'Work processes are clearly structured.',
          'Procedures support productivity.',
          'Approvals are processed efficiently.',
          'Technology and tools support my work.',
          'Workflows between departments are coordinated effectively.',
        ],
      },
      {
        name: 'Decision-Making Agility',
        questions: [
          'Decisions are made in a timely manner.',
          'Decision-making authority is clearly defined.',
          'Bureaucracy does not slow down important decisions.',
          'Managers are empowered to make appropriate decisions.',
          'The organization responds quickly to emerging challenges.',
        ],
      },
      {
        name: 'Cross-Functional Collaboration',
        questions: [
          'Different departments collaborate effectively.',
          'Cross-functional projects are managed smoothly.',
          'Information flows well across departments.',
          'There is alignment between departments on common goals.',
          'Interdepartmental coordination supports execution.',
        ],
      },
    ],
  },
  {
    pillar: 5,
    name: 'GROWTH & SUSTAINABILITY',
    subsections: [
      {
        name: 'Growth, Learning & Career Development',
        questions: [
          'I have access to learning opportunities.',
          'Training programs improve my skills.',
          'Career growth discussions happen periodically.',
          'Promotions are based on merit.',
          'I see long-term growth opportunities here.',
        ],
      },
      {
        name: 'Innovation & Adaptability',
        questions: [
          'The organization encourages innovation.',
          'Employees are supported in trying new ideas.',
          'The company adapts well to market changes.',
          'Continuous improvement is encouraged.',
          'Innovation is recognized and rewarded.',
        ],
      },
      {
        name: 'Communication & Transparency',
        questions: [
          'Important updates are communicated clearly.',
          'I receive timely information about changes.',
          'Organizational priorities are well communicated.',
          'Communication channels are effective.',
          'Leadership communicates honestly during challenges.',
        ],
      },
      {
        name: 'Overall Engagement & Organizational Confidence',
        questions: [
          'I feel motivated to give my best at work.',
          'I am proud to be associated with this organization.',
          'I would recommend this organization as a good workplace.',
          'I intend to stay here for the next two years.',
          'Overall, I am satisfied working here.',
        ],
      },
    ],
  },
];

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing sections and questions...');
    await Section.collection.dropIndexes().catch(() => {});
    await Question.collection.dropIndexes().catch(() => {});
    await Section.deleteMany({});
    await Question.deleteMany({});

    console.log('Creating sections and questions...');
    let sectionCount = 0;
    let questionCount = 0;

    for (const pillarData of pillars) {
      console.log(`\processing Pillar ${pillarData.pillar}: ${pillarData.name}`);

      let pillarQuestionOrder = 1; // Order across the entire pillar

      for (let subsectionIndex = 0; subsectionIndex < pillarData.subsections.length; subsectionIndex++) {
        const subsection = pillarData.subsections[subsectionIndex];
        const sectionOrder = subsectionIndex + 1;
        const sectionName = `Pillar ${pillarData.pillar}_${sectionOrder} (${subsection.name})`;

        // Create section
        const section = await Section.create({
          name: sectionName,
          pillar: pillarData.pillar,
          order: sectionOrder,
        });
        sectionCount++;
        console.log(`  Created section: ${sectionName}`);

        // Create questions for this subsection
        for (let qIndex = 0; qIndex < subsection.questions.length; qIndex++) {
          await Question.create({
            sectionId: section._id,
            text: subsection.questions[qIndex],
            order: pillarQuestionOrder++,
          });
          questionCount++;
        }
        console.log(`    Created ${subsection.questions.length} questions`);
      }
    }

    console.log(`\n✅ Database initialized successfully!`);
    console.log(`   - ${pillars.length} pillars created`);
    console.log(`   - ${sectionCount} subsections created`);
    console.log(`   - ${questionCount} questions created`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
