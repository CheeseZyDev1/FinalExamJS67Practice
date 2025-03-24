const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const db = new sqlite3.Database(path.join(__dirname, 'database', 'music.db'));

app.get('/', (req, res) => {
  res.render('index');
});

// ✅ CRUD แบบพิเศษกับ songs
const crud = (table) => {
  app.get(`/${table}`, (req, res) => {
    db.all(`SELECT * FROM ${table}`, [], (e, r) => e ? res.status(500).json(e) : res.json(r));
  });

  app.get(`/${table}/:id`, (req, res) => {
    db.get(`SELECT * FROM ${table} WHERE id=?`, [req.params.id], (e, r) =>
      e ? res.status(500).json(e) : r ? res.json(r) : res.status(404).json({ error: 'Not found' }));
  });

  app.post(`/${table}`, (req, res) => {
    if (table !== 'songs') return insertGeneric(table, req, res);
    const { title, author_name, author_genre, author_publisher, album_name, album_release_date, album_publisher, release_date } = req.body;

    getOrCreateAuthor(author_name, author_genre, author_publisher, (author_id) => {
      getOrCreateAlbum(album_name, album_release_date, album_publisher, (album_id) => {
        db.run(`INSERT INTO songs (title, author_id, album_id, release_date) VALUES (?, ?, ?, ?)`,
          [title, author_id, album_id, release_date], function (e) {
            if (e) return res.status(500).json(e);
            res.json({ id: this.lastID });
        });
      });
    });
  });

  app.put(`/${table}/:id`, (req, res) => {
    if (table !== 'songs') return updateGeneric(table, req, res);
    const { title, author_name, author_genre, author_publisher, album_name, album_release_date, album_publisher, release_date } = req.body;
    const id = req.params.id;

    getOrCreateAuthor(author_name, author_genre, author_publisher, (author_id) => {
      getOrCreateAlbum(album_name, album_release_date, album_publisher, (album_id) => {
        db.run(`UPDATE songs SET title=?, author_id=?, album_id=?, release_date=? WHERE id=?`,
          [title, author_id, album_id, release_date, id], function (e) {
            if (e) return res.status(500).json(e);
            if (!this.changes) return res.status(404).json({ error: 'Not found' });
            res.json({ updated: true });
        });
      });
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

// 🔍 Join เพลงพร้อมชื่อ author/album
app.get('/songs/details', (req, res) => {
  db.all(`
    SELECT songs.id, songs.title, songs.release_date,
           authors.name AS author_name,
           albums.name AS album_name
    FROM songs
    JOIN authors ON songs.author_id = authors.id
    JOIN albums ON songs.album_id = albums.id
  `, [], (e, r) => e ? res.status(500).json(e) : res.json(r));
});

// 💡 สร้าง CRUD
['songs', 'authors', 'albums'].forEach(crud);

// 🔧 ฟังก์ชันเสริม
function insertGeneric(table, req, res) {
  const keys = Object.keys(req.body);
  const vals = Object.values(req.body);
  const q = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
  db.run(q, vals, function (e) {
    if (e) return res.status(500).json(e);
    res.json({ id: this.lastID });
  });
}

function updateGeneric(table, req, res) {
  const keys = Object.keys(req.body);
  const vals = [...Object.values(req.body), req.params.id];
  const q = `UPDATE ${table} SET ${keys.map(k => k + '=?').join(',')} WHERE id=?`;
  db.run(q, vals, function (e) {
    if (e) return res.status(500).json(e);
    if (!this.changes) return res.status(404).json({ error: 'Not found' });
    res.json({ updated: true });
  });
}

function getOrCreateAuthor(name, genre = '', publisher = '', cb) {
  db.get(`SELECT id FROM authors WHERE name = ?`, [name], (e, row) => {
    if (row) return cb(row.id);
    db.run(`INSERT INTO authors (name, genre, publisher) VALUES (?, ?, ?)`,
      [name, genre, publisher], function () {
        cb(this.lastID);
      });
  });
}

function getOrCreateAlbum(name, release_date = '', publisher = '', cb) {
  db.get(`SELECT id FROM albums WHERE name = ?`, [name], (e, row) => {
    if (row) return cb(row.id);
    db.run(`INSERT INTO albums (name, release_date, publisher) VALUES (?, ?, ?)`,
      [name, release_date, publisher], function () {
        cb(this.lastID);
      });
  });
}

app.listen(3000, () => console.log('🚀 Server ready at http://localhost:3000'));
