const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// โหลดข้อมูล JSON จากไฟล์
const dataPath = path.join(__dirname, 'dt.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// สร้างหรือเชื่อมต่อฐานข้อมูล
const dbPath = path.join(__dirname, 'music2.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('❌ เชื่อมต่อ DB ไม่สำเร็จ:', err.message);
  console.log('✅ เชื่อมต่อฐานข้อมูล music.db แล้ว');
});

// สร้างตารางใหม่และใส่ข้อมูล
db.serialize(() => {
  // ลบตารางเดิมถ้ามี
  db.run(`DROP TABLE IF EXISTS songs`);
  db.run(`DROP TABLE IF EXISTS albums`);
  db.run(`DROP TABLE IF EXISTS authors`);

  // ตาราง authors
  db.run(`
    CREATE TABLE authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      genre TEXT,
      publisher TEXT
    )
  `);

  // ตาราง albums
  db.run(`
    CREATE TABLE albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      release_date TEXT NOT NULL,
      publisher TEXT
    )
  `);

  // ตาราง songs
  db.run(`
    CREATE TABLE songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author_id INTEGER,
      album_id INTEGER,
      release_date TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES authors(id),
      FOREIGN KEY (album_id) REFERENCES albums(id)
    )
  `);

  // เพิ่ม authors
  const insertAuthor = db.prepare(`INSERT INTO authors (name, genre, publisher) VALUES (?, ?, ?)`);
  data.authors.forEach(author => {
    insertAuthor.run(author.name, author.genre, author.publisher);
  });
  insertAuthor.finalize();

  // เพิ่ม albums
  const insertAlbum = db.prepare(`INSERT INTO albums (name, release_date, publisher) VALUES (?, ?, ?)`);
  data.albums.forEach(album => {
    insertAlbum.run(album.name, album.release_date, album.publisher);
  });
  insertAlbum.finalize();

  // เพิ่ม songs
  const insertSong = db.prepare(`INSERT INTO songs (title, author_id, album_id, release_date) VALUES (?, ?, ?, ?)`);
  data.songs.forEach(song => {
    insertSong.run(song.title, song.author_id, song.album_id, song.release_date);
  });
  insertSong.finalize();
});

db.close((err) => {
  if (err) return console.error('❌ ปิด DB ไม่สำเร็จ:', err.message);
  console.log('📦 สร้างตารางและเพิ่มข้อมูลเรียบร้อยแล้ว!');
});
