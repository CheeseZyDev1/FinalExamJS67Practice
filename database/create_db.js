const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// โหลดข้อมูล JSON
const data = JSON.parse(fs.readFileSync('./database/data.json', 'utf8'));

// เชื่อมต่อหรือสร้างไฟล์ music.db
const db = new sqlite3.Database('./database/music.db', (err) => {
    if (err) return console.error(err.message);
    console.log('🎵 Connected to music.db');
});

db.serialize(() => {
    // ✅ ล้างข้อมูลเก่า
    db.run(`DELETE FROM songs`);
    db.run(`DELETE FROM albums`);
    db.run(`DELETE FROM authors`);

    // ✅ รีเซต id ให้นับใหม่
    db.run(`DELETE FROM sqlite_sequence WHERE name='songs'`);
    db.run(`DELETE FROM sqlite_sequence WHERE name='albums'`);
    db.run(`DELETE FROM sqlite_sequence WHERE name='authors'`);

    // ✅ สร้างตาราง authors
    db.run(`CREATE TABLE IF NOT EXISTS authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        genre TEXT,
        publisher TEXT
    )`);

    // ✅ สร้างตาราง albums
    db.run(`CREATE TABLE IF NOT EXISTS albums (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        release_date TEXT NOT NULL,
        publisher TEXT
    )`);

    // ✅ สร้างตาราง songs
    db.run(`CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author_id INTEGER,
        album_id INTEGER,
        release_date TEXT NOT NULL,
        FOREIGN KEY (author_id) REFERENCES authors(id),
        FOREIGN KEY (album_id) REFERENCES albums(id)
    )`);

    // 📥 เพิ่ม authors
    const insertAuthor = db.prepare(`INSERT INTO authors (name, genre, publisher) VALUES (?, ?, ?)`);
    data.authors.forEach(author => {
        insertAuthor.run(author.name, author.genre, author.publisher);
    });
    insertAuthor.finalize();

    // 📥 เพิ่ม albums
    const insertAlbum = db.prepare(`INSERT INTO albums (name, release_date, publisher) VALUES (?, ?, ?)`);
    data.albums.forEach(album => {
        insertAlbum.run(album.name, album.release_date, album.publisher);
    });
    insertAlbum.finalize();

    // 📥 เพิ่ม songs
    const insertSong = db.prepare(`INSERT INTO songs (title, author_id, album_id, release_date) VALUES (?, ?, ?, ?)`);
    data.songs.forEach(song => {
        insertSong.run(song.title, song.author_id, song.album_id, song.release_date);
    });
    insertSong.finalize();
});

db.close((err) => {
    if (err) return console.error(err.message);
    console.log('✅ Database initialized and data imported!');
});
