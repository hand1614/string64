
"use strict";

class string64 {
  static #default_charset = [ ..."abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_" ] ;
  static #default_log_all = ( new Array( 56 ) ).fill( 0 ) ;
  static #default_log_hi  = ( new Array( 56 ) ).fill( 0 ) ;

  static encode ( str, init = {} ) {
    let   ret = "" ;
    const charset = init.charset ?? this.#default_charset ;
    const log_all = init.log_all ?? [ ...this.#default_log_all ] ;
    const log_hi  = init.log_hi  ?? [ ...this.#default_log_hi ] ;
    for( const v of str ) {
      const n         = v.codePointAt() ;
      const index_all = log_all.indexOf( n ) ;
      const index_hi  = log_hi.indexOf( n & 0x1fff00 ) ;
      const codelist =
        index_all !== -1                 ? [ index_all ]
      : n >> 8    === log_all[ 0 ] >> 8  ? [ 0x38 | n & 3, 0x3f & n >> 2 ]
      : index_hi  !== -1                 ? [ 0x3c | n & 3, 0x3f & n >> 2, index_hi ]
      : n >> 16   === log_all[ 0 ] >> 16 ? [ 0x3c | n & 3, 0x3f & n >> 2, 0x38 | n >> 8 & 3, 0x3f & n >> 10 ]
      :                                    [ 0x3c | n & 3, 0x3f & n >> 2, 0x3c | n >> 8 & 3, 0x3f & n >> 10, n >> 16 ] ;
      for( const code of codelist ) ret += charset[ code ] ;
      for( let i = ( index_hi + 1 || log_hi.length ) - 1 ; i > 0 ; i-- ) log_hi[ i ] = log_hi[ i - 1 ] ;
      log_hi[ 0 ] = n & 0x1fff00 ;
      for( let i = ( index_all + 1 || log_all.length ) - 1 ; i > 0 ; i-- ) log_all[ i ] = log_all[ i - 1 ] ;
      log_all[ 0 ] = n ;
    }
    return ret ;
  }

  static decode ( str, init = {} ) {
    let   ret = "" ;
    const charset = init.charset ?? this.#default_charset ;
    const log_all = init.log_all ?? [ ...this.#default_log_all ] ;
    const log_hi  = init.log_hi  ?? [ ...this.#default_log_hi ] ;
    const codelist = [] ;
    for( const char of str ) codelist.push( charset.indexOf( char ) ) ;
    for( let i = 0 ; i < str.length ; ) {
      const n =
        codelist[ i ]     & 0x38 ^ 0x38 ? log_all[ codelist[ i++ ] ]
      : codelist[ i ]     & 0x3c ^ 0x3c ? codelist[ i++ ] & 3 | codelist[ i++ ] << 2 | log_hi[ 0 ]
      : codelist[ i + 2 ] & 0x38 ^ 0x38 ? codelist[ i++ ] & 3 | codelist[ i++ ] << 2 | log_hi[ codelist[ i++ ] ]
      : codelist[ i + 2 ] & 0x3c ^ 0x3c ? codelist[ i++ ] & 3 | codelist[ i++ ] << 2 | ( codelist[ i++ ] & 3 ) << 8 | codelist[ i++ ] << 10 | log_hi[ 0 ] & 0x1f0000
      :                                   codelist[ i++ ] & 3 | codelist[ i++ ] << 2 | ( codelist[ i++ ] & 3 ) << 8 | codelist[ i++ ] << 10 | codelist[ i++ ] << 16 ;
      for( let j = ( log_hi.indexOf( n & 0x1fff00 ) + 1 || log_hi.length ) - 1 ; j > 0 ; j-- ) log_hi[ j ] = log_hi[ j - 1 ] ;
      log_hi[ 0 ] = n & 0x1fff00 ;
      for( let j = ( log_all.indexOf( n ) + 1 || log_all.length ) - 1 ; j > 0 ; j-- ) log_all[ j ] = log_all[ j - 1 ] ;
      log_all[ 0 ] = n ;
      ret += String.fromCodePoint( n ) ;
    }
    return ret ;
  }
}
