const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'))

const db = new sqlite3.Database(path.join(__dirname, 'database', 'music.db'));

// helper: ทำ route CRUD แบบย่อ
const crud = (table) => {
  app.get(`/${table}`, (req, res) => {
    db.all(`SELECT * FROM ${table}`, [], (e, r) => e ? res.status(500).json(e) : res.json(r));
  });
  app.get(`/${table}/:id`, (req, res) => {
    db.get(`SELECT * FROM ${table} WHERE id=?`, [req.params.id], (e, r) => {
      if (e) return res.status(500).json(e);
      if (!r) return res.status(404).json({ error: 'Not found' });
      res.json(r);
    });
  });
  app.post(`/${table}`, (req, res) => {
    const keys = Object.keys(req.body);
    const vals = Object.values(req.body);
    const q = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
    db.run(q, vals, function (e) {
      if (e) return res.status(500).json(e);
      res.json({ id: this.lastID });
    });
  });
  app.put(`/${table}/:id`, (req, res) => {
    const keys = Object.keys(req.body);
    const vals = [...Object.values(req.body), req.params.id];
    const q = `UPDATE ${table} SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`;
    db.run(q, vals, function (e) {
      if (e) return res.status(500).json(e);
      if (!this.changes) return res.status(404).json({ error: 'Not found' });
      res.json({ updated: true });
    });
  });
  app.delete(`/${table}/:id`, (req, res) => {
    db.run(`DELETE FROM ${table} WHERE id=?`, [req.params.id], function (e) {
      if (e) return res.status(500).json(e);
      if (!this.changes) return res.status(404).json({ error: 'Not found' });
      res.json({ deleted: true });
    });
  });
};

// CRUD สำหรับทั้ง 3 ตาราง
['songs', 'authors', 'albums'].forEach(crud);

// เริ่มเซิร์ฟเวอร์
app.listen(3000, () => console.log('🚀 Backend running at http://localhost:3000'));
