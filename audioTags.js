/* なみぐる！TOOLS:音声ファイルのタグ(曲名・アーティスト・ジャケット画像など)を読み、MP3用のID3v2.3として書き出す。
   読めるもの:MP3(ID3v2) / WAV(LIST INFO・id3) / FLAC / OGG(Vorbis・Opus) / M4A・MP4・MOV
   全部ブラウザの中だけで処理します。 */
(function(root){
  "use strict";
  var u8=function(b){return b instanceof Uint8Array?b:new Uint8Array(b)};
  var dv=function(a){return new DataView(a.buffer,a.byteOffset,a.byteLength)};
  var str=function(a,s,e,enc){
    var sl=a.subarray(s,e);
    if(enc==="latin1"){var o="";for(var i=0;i<sl.length;i++)o+=String.fromCharCode(sl[i]);return o}
    if(enc==="utf16"){ // BOMつき
      var le=true,off=0;if(sl[0]===0xFE&&sl[1]===0xFF){le=false;off=2}else if(sl[0]===0xFF&&sl[1]===0xFE){off=2}
      var r="";for(var j=off;j+1<sl.length;j+=2){r+=String.fromCharCode(le?sl[j]|sl[j+1]<<8:sl[j]<<8|sl[j+1])}return r}
    if(enc==="utf16be"){var q="";for(var k=0;k+1<sl.length;k+=2)q+=String.fromCharCode(sl[k]<<8|sl[k+1]);return q}
    try{return new TextDecoder("utf-8",{fatal:true}).decode(sl)}catch(e){}
    try{return new TextDecoder("shift_jis").decode(sl)}catch(e2){}
    return new TextDecoder("utf-8").decode(sl);
  };
  var clean=function(s){return String(s||"").replace(/\0+$/,"").replace(/\0/g,"/").trim()};
  var tag=function(t,k,v){v=clean(v);if(v&&!t[k])t[k]=v};

  /* ---------- ID3v2 ---------- */
  function id3Size(a,o){return a[o]<<21|a[o+1]<<14|a[o+2]<<7|a[o+3]}
  function textOf(a,s,e){ // 先頭1バイトが文字コード
    if(e<=s)return"";var enc=a[s],b=s+1;
    return enc===0?str(a,b,e,"latin1"):enc===1?str(a,b,e,"utf16"):enc===2?str(a,b,e,"utf16be"):str(a,b,e,"utf8");
  }
  function skipTerm(a,p,e,enc){ // 終端(\0 か \0\0)の次の位置
    if(enc===1||enc===2){while(p+1<e&&!(a[p]===0&&a[p+1]===0))p+=2;return Math.min(p+2,e)}
    while(p<e&&a[p]!==0)p++;return Math.min(p+1,e);
  }
  function parseId3(a,start){
    start=start||0;
    if(a[start]!==0x49||a[start+1]!==0x44||a[start+2]!==0x33)return null;
    var ver=a[start+3],flags=a[start+5],size=id3Size(a,start+6),body=a.subarray(start+10,start+10+size);
    if(ver<2||ver>4)return null;
    if(flags&0x80&&ver<4){var t=[];for(var i=0;i<body.length;i++){t.push(body[i]);if(body[i]===0xFF&&body[i+1]===0)i++}body=new Uint8Array(t)}
    var p=0,T={},v2=ver===2;
    if(ver>2&&flags&0x40){var es=ver===4?id3Size(body,0):dv(body).getUint32(0);p=es+(ver===3?4:0)}
    var hl=v2?6:10,map=v2?{TT2:"title",TP1:"artist",TAL:"album",TP2:"albumArtist",TCM:"composer",TYE:"year",TRK:"track",TCO:"genre"}
      :{TIT2:"title",TPE1:"artist",TALB:"album",TPE2:"albumArtist",TCOM:"composer",TYER:"year",TDRC:"year",TRCK:"track",TCON:"genre"};
    while(p+hl<=body.length){
      var id=str(body,p,p+(v2?3:4),"latin1");if(!/^[A-Z0-9]{3,4}$/.test(id))break;
      var sz=v2?(body[p+3]<<16|body[p+4]<<8|body[p+5]):ver===4?id3Size(body,p+4):dv(body).getUint32(p+4);
      var fs=p+hl,fe=fs+sz;if(fe>body.length||sz<0)break;
      if(map[id]){var tx=textOf(body,fs,fe);
        if(map[id]==="year")tx=(tx.match(/\d{4}/)||[""])[0];
        if(map[id]==="genre")tx=tx.replace(/^\((\d+)\)/,"").trim()||tx;
        tag(T,map[id],tx)}
      else if(id==="COMM"||id==="COM"){var enc=body[fs],q=fs+4;q=skipTerm(body,q,fe,enc);if(!T.comment)tag(T,"comment",textOfEnc(body,q,fe,enc))}
      else if(id==="APIC"&&!T.picture){var en=body[fs],m=fs+1,mm;
        var mime=str(body,m,(mm=body.indexOf(0,m))<0||mm>fe?fe:mm,"latin1");q=Math.min(mm+1,fe);
        var pt=body[q];q=skipTerm(body,q+1,fe,en);if(q<fe)T.picture={mime:/^image\//.test(mime)?mime:sniffMime(body.subarray(q,q+8)),data:body.slice(q,fe),type:pt}}
      else if(id==="PIC"&&!T.picture){var e3=body[fs],fmt=str(body,fs+1,fs+4,"latin1"),q3=skipTerm(body,fs+5,fe,e3);
        if(q3<fe)T.picture={mime:/png/i.test(fmt)?"image/png":"image/jpeg",data:body.slice(q3,fe)}}
      p=fe;
    }
    T._len=10+size+(flags&0x10?10:0);
    return T;
  }
  function textOfEnc(a,s,e,enc){return enc===0?str(a,s,e,"latin1"):enc===1?str(a,s,e,"utf16"):enc===2?str(a,s,e,"utf16be"):str(a,s,e,"utf8")}
  function sniffMime(h){return h[0]===0x89&&h[1]===0x50?"image/png":h[0]===0x47?"image/gif":h[0]===0x52?"image/webp":"image/jpeg"}

  /* ---------- Vorbisコメント(FLAC・OGG共通) ---------- */
  var VC={TITLE:"title",ARTIST:"artist",ALBUM:"album",ALBUMARTIST:"albumArtist",COMPOSER:"composer",DATE:"year",YEAR:"year",TRACKNUMBER:"track",GENRE:"genre",COMMENT:"comment",DESCRIPTION:"comment"};
  function parsePicBlock(a){
    var d=dv(a),p=0,type=d.getUint32(p);p+=4;var ml=d.getUint32(p);p+=4;var mime=str(a,p,p+ml,"latin1");p+=ml;
    var dl=d.getUint32(p);p+=4+dl;p+=16;var n=d.getUint32(p);p+=4;
    return{mime:mime&&/^image\//.test(mime)?mime:sniffMime(a.subarray(p,p+8)),data:a.slice(p,p+n),type:type};
  }
  function parseVorbisComment(a,s,T){
    var d=dv(a),p=s,vl=d.getUint32(p,true);p+=4+vl;var n=d.getUint32(p,true);p+=4;
    for(var i=0;i<n&&p+4<=a.length;i++){
      var l=d.getUint32(p,true);p+=4;var e=p+l;if(e>a.length)break;
      var s2=str(a,p,e,"utf8"),eq=s2.indexOf("=");p=e;if(eq<1)continue;
      var k=s2.slice(0,eq).toUpperCase(),v=s2.slice(eq+1);
      if(k==="METADATA_BLOCK_PICTURE"&&!T.picture){try{var bin=atob(v),b=new Uint8Array(bin.length);for(var j=0;j<bin.length;j++)b[j]=bin.charCodeAt(j);T.picture=parsePicBlock(b)}catch(x){}}
      else if(VC[k]){if(VC[k]==="year")v=(v.match(/\d{4}/)||[""])[0];tag(T,VC[k],v)}
    }
  }
  function parseFlac(a){
    var T={},p=4;
    while(p+4<=a.length){
      var h=a[p],last=h&0x80,type=h&0x7f,len=a[p+1]<<16|a[p+2]<<8|a[p+3],s=p+4;
      if(type===4)parseVorbisComment(a,s,T);
      else if(type===6&&!T.picture)try{T.picture=parsePicBlock(a.subarray(s,s+len))}catch(e){}
      p=s+len;if(last)break;
    }
    return T;
  }
  function parseOgg(a){
    // 2番目のパケット(コメントヘッダー)を、ページをまたいでも組み立てる
    var T={},p=0,pk=[],cur=[],count=0;
    while(p+27<=a.length&&a[p]===0x4F&&a[p+1]===0x67&&a[p+2]===0x67&&a[p+3]===0x53&&count<2){
      var ns=a[p+26],lac=a.subarray(p+27,p+27+ns),q=p+27+ns;
      for(var i=0;i<ns;i++){var L=lac[i];cur.push(a.subarray(q,q+L));q+=L;if(L<255){pk.push(cur);cur=[];count++;if(count>=2)break}}
      p=q;
    }
    if(pk.length<2)return T;
    var parts=pk[1],tot=0;parts.forEach(function(x){tot+=x.length});var b=new Uint8Array(tot),o=0;parts.forEach(function(x){b.set(x,o);o+=x.length});
    var off=b[0]===3&&str(b,1,7,"latin1")==="vorbis"?7:str(b,0,8,"latin1")==="OpusTags"?8:-1;
    if(off>=0)try{parseVorbisComment(b,off,T)}catch(e){}
    return T;
  }

  /* ---------- WAV ---------- */
  var INFO={INAM:"title",IART:"artist",IPRD:"album",ICRD:"year",IGNR:"genre",ICMT:"comment",ITRK:"track",IPRT:"track",ICOP:null,IMUS:"composer"};
  function parseWav(a){
    var T={},d=dv(a),p=12;
    while(p+8<=a.length){
      var id=str(a,p,p+4,"latin1"),sz=d.getUint32(p+4,true),s=p+8,e=Math.min(s+sz,a.length);
      if(id==="LIST"&&str(a,s,s+4,"latin1")==="INFO"){
        var q=s+4;while(q+8<=e){var k=str(a,q,q+4,"latin1"),l=d.getUint32(q+4,true),ve=Math.min(q+8+l,e);
          if(INFO[k]){var v=str(a,q+8,ve,"utf8");if(INFO[k]==="year")v=(v.match(/\d{4}/)||[""])[0];tag(T,INFO[k],v)}
          q=q+8+l+(l&1)}
      }else if((id==="id3 "||id==="ID3 ")&&sz>10){var t=parseId3(a,s);if(t)for(var key in t)if(!T[key])T[key]=t[key]}
      p=s+sz+(sz&1);
    }
    return T;
  }

  /* ---------- MP4 / M4A / MOV ---------- */
  function boxes(a,s,e,fn){
    var d=dv(a),p=s;
    while(p+8<=e){
      var sz=d.getUint32(p),t=str(a,p+4,p+8,"latin1"),h=8;
      if(sz===1){sz=d.getUint32(p+8)*4294967296+d.getUint32(p+12);h=16}else if(sz===0)sz=e-p;
      if(sz<h||p+sz>e+0)sz=Math.min(Math.max(sz,h),e-p);
      if(fn(t,p+h,p+sz)===false)return;
      p+=sz;
    }
  }
  var MP={"©nam":"title","©ART":"artist","©alb":"album","aART":"albumArtist","©wrt":"composer","©day":"year","©gen":"genre","©cmt":"comment"};
  function parseMp4(a){
    var T={};
    boxes(a,0,a.length,function(t,s,e){
      if(t!=="moov")return;
      boxes(a,s,e,function(t2,s2,e2){
        if(t2!=="udta")return;
        boxes(a,s2,e2,function(t3,s3,e3){
          if(t3!=="meta")return;
          boxes(a,s3+4,e3,function(t4,s4,e4){
            if(t4!=="ilst")return;
            boxes(a,s4,e4,function(k,s5,e5){
              boxes(a,s5,e5,function(t6,s6,e6){
                if(t6!=="data")return;
                var flag=a[s6+3]&0xff,pl=a.subarray(s6+8,e6);
                if(k==="covr"){if(!T.picture&&pl.length)T.picture={mime:flag===14?"image/png":"image/jpeg",data:pl.slice()}}
                else if(k==="trkn"){if(pl.length>=4&&(pl[2]<<8|pl[3]))tag(T,"track",String(pl[2]<<8|pl[3]))}
                else if(MP[k]){var v=str(pl,0,pl.length,"utf8");if(MP[k]==="year")v=(v.match(/\d{4}/)||[""])[0];tag(T,MP[k],v)}
              });
            });
          });
        });
      });
    });
    return T;
  }

  /* ---------- 入口 ---------- */
  function read(buf){
    var a=u8(buf),T={};
    try{
      var m4=a.length>12&&str(a,4,8,"latin1")==="ftyp"||(a.length>12&&/^(moov|mdat|free|wide)$/.test(str(a,4,8,"latin1")));
      if(a[0]===0x49&&a[1]===0x44&&a[2]===0x33)T=parseId3(a,0)||{};
      else if(a[0]===0x66&&a[1]===0x4C&&a[2]===0x61&&a[3]===0x43)T=parseFlac(a);
      else if(a[0]===0x4F&&a[1]===0x67&&a[2]===0x67&&a[3]===0x53)T=parseOgg(a);
      else if(a[0]===0x52&&a[1]===0x49&&a[2]===0x46&&a[3]===0x46&&str(a,8,12,"latin1")==="WAVE")T=parseWav(a);
      else if(m4)T=parseMp4(a);
    }catch(e){T={}}
    delete T._len;
    return T;
  }

  /* ---------- ID3v2.3 を書く ---------- */
  function enc16(s){var o=new Uint8Array(2+s.length*2);o[0]=0xFF;o[1]=0xFE;for(var i=0;i<s.length;i++){o[2+i*2]=s.charCodeAt(i)&255;o[3+i*2]=s.charCodeAt(i)>>8}return o}
  function textBytes(s){ // 文字コードバイト+本文
    var lat=true;for(var i=0;i<s.length;i++)if(s.charCodeAt(i)>255){lat=false;break}
    if(lat){var o=new Uint8Array(1+s.length);for(var j=0;j<s.length;j++)o[1+j]=s.charCodeAt(j);return o}
    var b=enc16(s),r=new Uint8Array(1+b.length);r[0]=1;r.set(b,1);return r;
  }
  function frame(id,body){var o=new Uint8Array(10+body.length),d=dv(o);for(var i=0;i<4;i++)o[i]=id.charCodeAt(i);d.setUint32(4,body.length);o.set(body,10);return o}
  function cat(parts){var n=0;parts.forEach(function(x){n+=x.length});var o=new Uint8Array(n),p=0;parts.forEach(function(x){o.set(x,p);p+=x.length});return o}
  function write(T){
    var fr=[],add=function(id,v){if(v)fr.push(frame(id,textBytes(String(v))))};
    add("TIT2",T.title);add("TPE1",T.artist);add("TALB",T.album);add("TPE2",T.albumArtist);add("TCOM",T.composer);add("TYER",T.year);add("TRCK",T.track);add("TCON",T.genre);
    if(T.comment){var tb=textBytes(String(T.comment));
      // COMM: 文字コード,言語3,説明(空),本文。UTF-16のときは説明にもBOMと終端が要る
      var hd=tb[0]===1?[1,106,112,110,0xFF,0xFE,0,0]:[0,106,112,110,0];
      fr.push(frame("COMM",cat([new Uint8Array(hd),tb.subarray(1)])))}
    if(T.picture&&T.picture.data&&T.picture.data.length){
      var mime=new TextEncoder().encode(T.picture.mime||"image/jpeg");
      fr.push(frame("APIC",cat([new Uint8Array([0]),mime,new Uint8Array([0,3,0]),T.picture.data])));
    }
    if(!fr.length)return new Uint8Array(0);
    var body=cat(fr),n=body.length,h=new Uint8Array(10);
    h.set([0x49,0x44,0x33,3,0,0,(n>>21)&127,(n>>14)&127,(n>>7)&127,n&127]);
    return cat([h,body]);
  }
  var api={read:read,write:write,has:function(T){return !!(T&&(T.title||T.artist||T.album||T.picture||T.year||T.track||T.genre||T.comment||T.composer||T.albumArtist))}};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.ngTags=api;
})(typeof window!=="undefined"?window:globalThis);
