var ffi = require('ffi');
var ref = require('ref')

var sqlite3 = 'void' // `sqlite3` is an "opaque" type, so we don't know its layout
  , sqlite3Ptr = ref.refType(sqlite3)
  , sqlite3PtrPtr = ref.refType(sqlite3Ptr)
  , sqlite3_exec_callback = 'pointer' // TODO: use ffi.Callback when #76 is implemented
  , stringPtr = ref.refType('string');

var SQLite3 = ffi.Library('./libsqlite3.dylib', {
  'sqlite3_libversion': [ 'string', [ ] ],
  'sqlite3_open': [ 'int', [ 'string', sqlite3PtrPtr ] ],
  'sqlite3_open_v2': [ 'int', [ 'string', sqlite3PtrPtr, 'int', 'string' ] ],
  'sqlite3_close': [ 'int', [ sqlite3Ptr ] ],
  'sqlite3_changes': [ 'int', [ sqlite3Ptr ]],
  'sqlite3_exec': [ 'int', [ sqlite3Ptr, 'string', sqlite3_exec_callback, 'void *', stringPtr ] ],
})

var sqltorrent = ffi.Library('sqltorrent.dylib', {
  'sqltorrent_init': [ 'int', [ 'int' ] ],
  'new_session': [ 'pointer', [ ] ],
  'new_add_torrent_params': [ 'pointer', [] ],
  'set_url': [ 'void', ['pointer', 'CString'] ],
  'set_save_path': [ 'void', ['pointer', 'CString'] ],
  'add_torrent': [ 'pointer', ['pointer', 'pointer'] ],
  'alert_loop': [ 'void', ['pointer', 'pointer'] ],
  'new_db': [ 'pointer', [ ] ],
  'sqltorrent_open': [ 'int', [ 'string', 'pointer', 'string'] ],
});


var torrent = 'magnet:?xt=urn:btih:3479bdac55e8bb1a427385400a963265970e209c';

sqltorrent.sqltorrent_init(0);

// create a storage area for the db pointer SQLite3 gives us
var db = ref.alloc(sqlite3PtrPtr)

// open the database object
SQLite3.sqlite3_open_v2(torrent, db, 1, 'torrent')

// we don't care about the `sqlite **`, but rather the `sqlite *` that it's
// pointing to, so we must deref()
db = db.deref()

var rowCount = 0
var callback = ffi.Callback('int', ['void *', 'int', stringPtr, stringPtr], function (tmp, cols, argv, colv) {
  var obj = {}

  for (var i = 0; i < cols; i++) {
    var colName = colv.deref()
    var colData = argv.deref()
    obj[colName] = colData
  }

  console.log('Row: %j', obj)
  rowCount++

  return 0
})

var b = new Buffer('test')
SQLite3.sqlite3_exec.async(db, 'SELECT * FROM foo;', callback, b, null, function (err, ret) {
  if (err) throw err
  console.log('Total Rows: %j', rowCount)
  console.log('Changes: %j', SQLite3.sqlite3_changes(db))
  console.log('Closing...')
  SQLite3.sqlite3_close(db)
  fs.unlinkSync(dbName)
  fin = true
})


// var db = sqltorrent.new_db();
// var open = sqltorrent.sqltorrent_open(torrent, db, 'torrent')
// SQLite3.sqlite3_close(db)

// var session = sqltorrent.new_session();
// var atp = sqltorrent.new_add_torrent_params();
// sqltorrent.set_url(atp, torrent);
// sqltorrent.set_save_path(atp, '.')
//
// sqltorrent.add_torrent(session, atp);
//
// var callback = ffi.Callback('void', ['string'], msg => console.log(msg));
// sqltorrent.alert_loop.async(session, callback, () => {});
