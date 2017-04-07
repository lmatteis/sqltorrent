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
  'sqlite3_errmsg': [ 'string' , [ 'pointer' ]]
})

var sqltorrent = ffi.Library('sqltorrent.dylib', {
  'sqltorrent_init': [ 'int', [ 'pointer', 'string', 'int' ] ],
  'new_session': [ 'pointer', [ ] ],
  'new_add_torrent_params': [ 'pointer', [] ],
  'set_url': [ 'void', ['pointer', 'CString'] ],
  'set_save_path': [ 'void', ['pointer', 'CString'] ],
  'add_torrent': [ 'pointer', ['pointer', 'pointer'] ],
  'alert_loop': [ 'void', [ 'pointer', 'pointer'] ],
  'new_db': [ 'pointer', [ ] ],
  'sqltorrent_open': [ 'int', [ 'string', 'pointer', 'string'] ],
  'get_session': [ 'pointer', [ 'pointer'] ],
  'new_context': [ 'pointer', [ 'string'] ],
  'query_torrents': [ 'void', [ 'pointer', 'pointer'] ],
});

var torrent = 'kat.torrent';

// start two separate sessions

var save_path1 = 'torrent1/.';
var ctx1 = sqltorrent.new_context(save_path1);
sqltorrent.sqltorrent_init(ctx1, 'torrent1', 0); // gonna register a vfs called torrent1

// create a storage area for the db pointer SQLite3 gives us
var db1 = ref.alloc(sqlite3PtrPtr)
var open = SQLite3.sqlite3_open_v2.async(torrent, db1, 1, 'torrent1', (err, ret) => {
  console.log('DB OPENED TORRENT1', ret)
  if (ret !== 0) return console.error('error:', SQLite3.sqlite3_errmsg(db1))
});
var callback = ffi.Callback('void', ['pointer', 'string', 'string'], (alert, msg, type) => {
  console.log('TORRENT1', msg, type)
  if (type === 'state_update_alert')
});
sqltorrent.alert_loop.async(ctx1, callback, () => {});


/// torrent 2
// var save_path2 = 'torrent2/.';
// var ctx2 = sqltorrent.new_context(save_path2);
// sqltorrent.sqltorrent_init(ctx2, 'torrent2', 0); // gonna register a vfs called torrent2
//
// // create a storage area for the db pointer SQLite3 gives us
// var db2 = ref.alloc(sqlite3PtrPtr)
// var open = SQLite3.sqlite3_open_v2.async(torrent, db2, 1, 'torrent2', (err, ret) => {
//   console.log('DB OPENED TORRENT2', ret)
//   if (ret !== 0) return console.error('error:', SQLite3.sqlite3_errmsg(db2))
// });
// var callback = ffi.Callback('void', ['pointer', 'string', 'string'], (alert, msg, type) => {
//   console.log('TORRENT2', msg)
// });
// sqltorrent.alert_loop.async(ctx2, callback, () => {});
