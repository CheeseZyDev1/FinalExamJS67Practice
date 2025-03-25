// 📦 เรียกใช้ module ที่จำเป็น
const express = require('express');         // สำหรับสร้างเว็บเซิร์ฟเวอร์
const sqlite3 = require('sqlite3').verbose(); // สำหรับใช้งานฐานข้อมูล SQLite
const path = require('path');                 // ใช้จัดการ path ของไฟล์ต่าง ๆ

const app = express(); // สร้างเซิร์ฟเวอร์ Express

// 🧱 ตั้งค่าการทำงานของเซิร์ฟเวอร์
app.use(express.json()); // แปลงข้อมูล JSON จากผู้ใช้ให้ใช้งานในโค้ดได้
app.use(express.urlencoded({ extended: true })); // รองรับข้อมูลแบบฟอร์ม
//app.use(express.static('public')); // ให้โฟลเดอร์ public เปิดไฟล์ CSS/JS/HTML ได้

app.set('view engine', 'ejs'); // บอก Express ว่าเราจะใช้ EJS สำหรับสร้างหน้าเว็บ
app.set('views', path.join(__dirname, 'views')); // โฟลเดอร์ที่เก็บไฟล์ EJS

// 💾 เชื่อมต่อกับฐานข้อมูล SQLite ชื่อ music.db
const db = new sqlite3.Database(path.join(__dirname,'music2.db'));

// 🌐 แสดงหน้าแรก
app.get('/', (req, res) => {
  res.render('ft'); // แสดงไฟล์ views/index.ejs
});

// 📚 ตัวอย่าง route ง่าย ๆ เพื่อให้เข้าใจการดึงข้อมูล
app.get('/author/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM authors WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).send('เกิดข้อผิดพลาด');
    if (!row) return res.status(404).send('ไม่พบผู้แต่ง');
    res.json(row);
  });
});

app.get('/album/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM albums WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).send('เกิดข้อผิดพลาด');
    if (!row) return res.status(404).send('ไม่พบอัลบั้ม');
    res.json(row);
  });
});

app.get('/song/:id', (req, res) => {
  const id = req.params.id;
  const sql = `SELECT songs.id, songs.title, songs.release_date,
                      authors.name AS author_name,
                      albums.name AS album_name
               FROM songs
               JOIN authors ON songs.author_id = authors.id
               JOIN albums ON songs.album_id = albums.id
               WHERE songs.id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).send('เกิดข้อผิดพลาด');
    if (!row) return res.status(404).send('ไม่พบเพลง');
    res.json(row);
  });
});

// ➕ เพิ่มข้อมูลผู้แต่ง
app.post('/author', (req, res) => {
  const { name, genre, publisher } = req.body;
  db.run('INSERT INTO authors (name, genre, publisher) VALUES (?, ?, ?)',
    [name, genre, publisher], function (err) {
      if (err) return res.status(500).send('เพิ่มข้อมูลไม่สำเร็จ');
      res.send(`เพิ่มผู้แต่งแล้ว ID คือ ${this.lastID}`);
    });
});

// ✏️ แก้ไขข้อมูลผู้แต่ง
app.put('/author/:id', (req, res) => {
  const { name, genre, publisher } = req.body;
  const id = req.params.id;
  db.run('UPDATE authors SET name=?, genre=?, publisher=? WHERE id=?',
    [name, genre, publisher, id], function (err) {
      if (err) return res.status(500).send('แก้ไขไม่สำเร็จ');
      if (!this.changes) return res.status(404).send('ไม่พบข้อมูลให้แก้ไข');
      res.send('แก้ไขสำเร็จ');
    });
});

// 🗑 ลบผู้แต่ง
app.delete('/author/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM authors WHERE id=?', [id], function (err) {
    if (err) return res.status(500).send('ลบไม่สำเร็จ');
    if (!this.changes) return res.status(404).send('ไม่พบข้อมูลให้ลบ');
    res.send('ลบสำเร็จ');
  });
});

// ➕ เพิ่มอัลบั้ม
app.post('/album', (req, res) => {
  const { name, release_date, publisher } = req.body;
  db.run('INSERT INTO albums (name, release_date, publisher) VALUES (?, ?, ?)',
    [name, release_date, publisher], function (err) {
      if (err) return res.status(500).send('เพิ่มอัลบั้มไม่สำเร็จ');
      res.send(`เพิ่มอัลบั้มแล้ว ID คือ ${this.lastID}`);
    });
});

// ✏️ แก้ไขอัลบั้ม
app.put('/album/:id', (req, res) => {
  const { name, release_date, publisher } = req.body;
  const id = req.params.id;
  db.run('UPDATE albums SET name=?, release_date=?, publisher=? WHERE id=?',
    [name, release_date, publisher, id], function (err) {
      if (err) return res.status(500).send('แก้ไขไม่สำเร็จ');
      if (!this.changes) return res.status(404).send('ไม่พบอัลบั้มให้แก้ไข');
      res.send('แก้ไขสำเร็จ');
    });
});

// 🗑 ลบอัลบั้ม
app.delete('/album/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM albums WHERE id=?', [id], function (err) {
    if (err) return res.status(500).send('ลบไม่สำเร็จ');
    if (!this.changes) return res.status(404).send('ไม่พบอัลบั้มให้ลบ');
    res.send('ลบสำเร็จ');
  });
});

// ➕ เพิ่มเพลง (ใช้ author_id และ album_id โดยตรง)
app.post('/song', (req, res) => {
  const { title, author_id, album_id, release_date } = req.body;
  db.run('INSERT INTO songs (title, author_id, album_id, release_date) VALUES (?, ?, ?, ?)',
    [title, author_id, album_id, release_date], function (err) {
      if (err) return res.status(500).send('เพิ่มเพลงไม่สำเร็จ');
      res.send(`เพิ่มเพลงแล้ว ID คือ ${this.lastID}`);
    });
});

// ✏️ แก้ไขเพลง
app.put('/song/:id', (req, res) => {
  const { title, author_id, album_id, release_date } = req.body;
  const id = req.params.id;
  db.run('UPDATE songs SET title=?, author_id=?, album_id=?, release_date=? WHERE id=?',
    [title, author_id, album_id, release_date, id], function (err) {
      if (err) return res.status(500).send('แก้ไขเพลงไม่สำเร็จ');
      if (!this.changes) return res.status(404).send('ไม่พบเพลงให้แก้ไข');
      res.send('แก้ไขสำเร็จ');
    });
});

// 🗑 ลบเพลง
app.delete('/song/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM songs WHERE id=?', [id], function (err) {
    if (err) return res.status(500).send('ลบเพลงไม่สำเร็จ');
    if (!this.changes) return res.status(404).send('ไม่พบเพลงให้ลบ');
    res.send('ลบสำเร็จ');
  });
});

// ✅ เพิ่ม route ที่ join ตารางเพลง + ผู้แต่ง + อัลบั้ม
app.get('/songs/details', (req, res) => {
  const sql = `
    SELECT songs.id, songs.title, songs.release_date,
           authors.name AS author_name,
           albums.name AS album_name
    FROM songs
    LEFT JOIN authors ON songs.author_id = authors.id
    LEFT JOIN albums ON songs.album_id = albums.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// 🚀 เริ่มต้นให้เซิร์ฟเวอร์รอรับคำขอที่พอร์ต 3000
app.listen(3000, () => {
  console.log('เซิร์ฟเวอร์พร้อมใช้งานที่ http://localhost:3000');
});
