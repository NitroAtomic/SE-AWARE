const fs = require('fs');
const path = require('path');
const vm = require('vm');
const pool = require('../config/db');

async function main() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['quiz-data.js', 'quiz-data-premium.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'js', file), 'utf8'), context, { filename: file });
  }
  const banks = context.window.QUIZ_DATA || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const [slug, bank] of Object.entries(banks)) {
      const [rows] = await conn.query(`SELECT q.quiz_id FROM quizzes q JOIN modules m ON m.module_id = q.module_id WHERE m.slug = ?`, [slug]);
      if (!rows.length) throw new Error(`No database quiz exists for module ${slug}`);
      const quizId = rows[0].quiz_id;
      await conn.query('DELETE FROM quiz_questions WHERE quiz_id = ?', [quizId]);
      for (let index = 0; index < bank.questions.length; index += 1) {
        const question = bank.questions[index];
        await conn.query(`INSERT INTO quiz_questions
          (quiz_id, question_text, options, correct_option_index, order_index)
          VALUES (?, ?, ?, ?, ?)`, [quizId, question.q, JSON.stringify(question.options), question.answer, index]);
      }
      await conn.query('UPDATE quizzes SET number_of_questions = ? WHERE quiz_id = ?', [bank.questions.length, quizId]);
    }
    await conn.commit();
    console.log(`Seeded ${Object.keys(banks).length} quiz banks.`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
