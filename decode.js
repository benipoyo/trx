// implemented based on https://github.com/32th-System/py-tsadecode and https://github.com/n-rook/thscoreboard

function formatTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${mm}:${s}`;
}

function decodeNote(txt) {
  if (txt[0] === 0xef && txt[1] === 0xbb && txt[2] === 0xbf) return new TextDecoder("utf-8", { ignoreBOM: true }).decode(txt);
  return new TextDecoder("shift-jis").decode(txt);
}

function userData(rpy) {
  const len = rpy.length;
  const ret = {};
  ret.thprac = false;
  const td = new TextDecoder();
  const game = td.decode(rpy.slice(0, 4));
  if (td.decode(rpy.slice(len - 4)) === "PRAC") {
    ret.thprac = true;
    return ret;
  }
  if (game === "T6RP" || game === "T7RP" || len < 0x10) return ret;
  const dv = new DataView(rpy.buffer);
  const user = [];
  let offset = dv.getUint32(0xc, true);
  while (offset + 0x8 <= len) {
    if (td.decode(rpy.slice(offset, offset + 0x4)) !== "USER") break;
    const size = dv.getUint32(offset + 0x4, true);
    user.push(rpy.slice(offset, offset + size));
    offset += size;
  }
  if (user.length < 1) return ret;
  if (game === "T8RP") {
    ret.year = td.decode(user[0].slice(0x2e, 0x32));
    ret.time = td.decode(user[0].slice(0x39, 0x41));
    ret.clear = "-";
    let crlf = 0;
    for (let i = 0x43; i < user[0].length; i++) {
      if (user[0][i] !== 0xd || user[0][i + 1] !== 0xa) continue;
      crlf++;
      if (crlf < 3) continue;
      for (let j = i + 2; j < user[0].length; j++) {
        if (user[0][j] !== 0x9) continue;
        for (let k = j + 1; k < user[0].length; k++) {
          if (user[0][k] !== 0xd || user[0][k + 1] !== 0xa) continue;
          switch (td.decode(user[0].slice(j + 1, j + 6))) {
            case "Clear":
              ret.clear = "(C)";
              break;
            case "Stage":
              ret.clear = "(" + (user[0][j + 7] - 0x30) + ")";
              break;
            case "Extra":
              ret.clear = "(Ex)";
          }
          break;
        }
        break;
      }
      break;
    }
  }
  if (game === "t13r") {
    switch (user[0][0x10]) {
      case 0x90:
        ret.game = "th13";
        break;
      case 0x8b:
        ret.game = "th14";
    }
  }
  if (user.length < 2) return ret;
  for (let i = 1; i < user.length; i++) {
    if (td.decode(user[i].slice(0x8, 0xc)) === "PRAC") {
      ret.thprac = true;
    }
    else if (user[i][user[i].length - 2]) ret.note = decodeNote(user[i].slice(0xc)).replace(/\0*$/, "");
  }
  return ret;
}

function decode6(rpy, key, keyBegin) {
  let m = 0;
  for (let i = 0; i < rpy.length; i++) {
    if (i === key) m = rpy[i];
    if (i < keyBegin) continue;
    rpy[i] -= m;
    m = (m + 7) & 0xff;
  }
}

function reg(b, ring, cnt, out) {
  ring[cnt] = b;
  out.push(b);
  return (cnt + 1) & 0x1fff;
}
function decompress7(buf, begin) {
  const out = [];
  const ring = Array(0x2000).fill(0);
  let bit = 7;
  let cnt = 1;
  for (let i = 0; i < buf.length - 3;) {
    if (i < begin) {
      out.push(buf[i]);
      i++;
      continue;
    }
    const flag = buf[i] & (1 << bit);
    if (bit === 0) { bit = 8; i++; }
    bit--;
    if (flag) {
      cnt = reg((buf[i] << (7 - bit) | buf[i + 1] >> (1 + bit)) & 0xff, ring, cnt, out);
      i++;
      continue;
    }
    const f = bit < 4 ? buf[i + 1] << (4 - bit) : buf[i + 1] >> (bit - 4);
    let pos = (buf[i] << (12 - bit) | f | buf[i + 2] >> (4 + bit)) & 0x1fff;
    i++;
    const n = (buf[i] << (8 - bit) | buf[i + 1] >> bit) & 0xf;
    i++;
    for (let j = 0; j < n + 3; j++) {
      cnt = reg(ring[pos], ring, cnt, out);
      pos = (pos + 1) & 0x1fff;
    }
    if (bit === 0) { bit = 8; i++; }
    bit--;
  }
  return new Uint8Array(out);
}

function decode10(buf, begin, size, base, add) {
  for (let i = begin; i < buf.length; i += size) {
    const tmp = buf.slice(i, i + size);
    if (tmp.length < size / 4) break;
    const len = tmp.length / 2 * 2;
    let p = i + len - 1;
    let j = 0;
    for (; j < len / 2; j++) {
      buf[p] = tmp[j] ^ base;
      base = (base + add) & 0xff;
      p -= 2;
    }
    p = i + len - 2;
    for (; j < len; j++) {
      buf[p] = tmp[j] ^ base;
      base = (base + add) & 0xff;
      p -= 2;
    }
  }
}

function th6(rpy) {
  const buf = rpy.slice();
  decode6(buf, 0xe, 0xf);
  const len = buf.length;
  const ret = {};
  const td = new TextDecoder();
  const dv = new DataView(buf.buffer);
  ret.type = buf[0x6];
  ret.difficulty = buf[0x7];
  ret.date = td.decode(buf.slice(0x10, 0x19)).replace(/^(..)\/(..)\/(..).*$/, "20$3-$1-$2");
  ret.name = td.decode(buf.slice(0x19, 0x22)).replace(/[ \0]*$/, "");
  if (len >= 0x28) ret.score = dv.getUint32(0x24, true);
  ret.stages = [];
  for (let i = 0; i < 7; i++) {
    if (len < 0x34 + i * 4 + 4) break;
    const pos = dv.getUint32(0x34 + i * 4, true);
    if (pos === 0 || pos + 0xa >= len) continue;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos, true);
    ret.stages[i].power = dv.getUint8(pos + 0x8);
    ret.stages[i].player = buf[pos + 0x9];
    ret.stages[i].bomb = buf[pos + 0xa];
  }
  return ret;
}

function th7(rpy) {
  const buf0 = rpy.slice();
  decode6(buf0, 0xd, 0x10);
  const buf = decompress7(buf0, 0x54);
  const len = buf.length;
  const ret = {};
  const td = new TextDecoder();
  const dv = new DataView(buf.buffer);
  ret.type = buf[0x56];
  ret.difficulty = buf[0x57];
  ret.date = td.decode(buf.slice(0x58, 0x5e)).replace(/^(..)\/(..).*$/, "$1-$2");
  ret.name = td.decode(buf.slice(0x5e, 0x67)).replace(/[ \0]*$/, "");
  if (len >= 0x70) ret.score = dv.getUint32(0x6c, true);
  ret.stages = [];
  for (let i = 0; i < 7; i++) {
    if (len < 0x1c + i * 4 + 4) break;
    const pos = dv.getUint32(0x1c + i * 4, true);
    if (pos === 0 || pos + 0x2b > len) continue;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos, true);
    ret.stages[i].point = dv.getUint32(pos + 0x4, true);
    ret.stages[i].cherryPiv = dv.getUint32(pos + 0x8, true);
    ret.stages[i].cherryMax = dv.getUint32(pos + 0xc, true);
    ret.stages[i].cherryPlus = dv.getUint32(pos + 0x10, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x14, true);
    ret.stages[i].power = dv.getUint8(pos + 0x22);
    ret.stages[i].player = buf[pos + 0x23];
    ret.stages[i].bomb = buf[pos + 0x24];
    ret.stages[i].spell = dv.getUint8(pos + 0x27);
  }
  return ret;
}

function th8(rpy) {
  const buf0 = rpy.slice();
  decode6(buf0, 0x15, 0x18);
  const buf = decompress7(buf0, 0x68);
  const len = buf.length;
  const ret = {};
  const td = new TextDecoder();
  const dv = new DataView(buf.buffer);
  ret.type = buf[0x6a];
  ret.difficulty = buf[0x6b];
  ret.date = td.decode(buf.slice(0x6c, 0x72)).replace(/^(..)\/(..).*$/, "$1-$2");
  ret.name = td.decode(buf.slice(0x72, 0x7b)).replace(/[ \0]*$/, "");
  if (len >= 0x7e) ret.spellNo = dv.getInt16(0x7c, true);
  ret.spell = new TextDecoder("shift-jis").decode(buf.slice(0x7e, 0xaf)).replace(/\0*$/, "");
  if (len >= 0xb4) ret.score = dv.getUint32(0xb0, true);
  ret.stages = [];
  for (let i = 0; i < 9; i++) {
    if (len < 0x20 + i * 4 + 4) break;
    const pos = dv.getUint32(0x20 + i * 4, true);
    if (pos === 0 || pos + 0x1e >= len) continue;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos, true);
    ret.stages[i].point = dv.getUint32(pos + 0x4, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x8, true);
    ret.stages[i].piv = dv.getUint32(pos + 0x14, true);
    ret.stages[i].rate = dv.getInt16(pos + 0x18, true);
    ret.stages[i].power = dv.getUint8(pos + 0x1c);
    ret.stages[i].player = buf[pos + 0x1d];
    ret.stages[i].bomb = buf[pos + 0x1e];
  }
  return ret;
}

function th9(rpy) {
  const buf0 = rpy.slice();
  decode6(buf0, 0x15, 0x18);
  const buf = decompress7(buf0, 0xc0);
  const len = buf.length;
  const ret = {};
  const td = new TextDecoder();
  const dv = new DataView(buf.buffer);
  ret.date = td.decode(buf.slice(0xc4, 0xcd)).replace(/^(..)\/(..)\/(..).*$/, "20$1-$2-$3");
  ret.name = td.decode(buf.slice(0xce, 0xd7)).replace(/[ \0]*$/, "");
  ret.difficulty = buf[0xd7];
  ret.type = buf[0x1f2];
  ret.cpu = buf[0x1f3];
  ret.stages = [];
  for (let i = 0; i < 10; i++) {
    if (len < 0x48 + i * 4 + 4) break;
    for (let j = 0; j < 2; j++) {
      const pos = dv.getUint32(0x20 + (i + j * 10) * 4, true);
      if (pos === 0 || pos + 0x8 >= len) break;
      if (j === 0) ret.stages[i] = [{}, {}];
      ret.stages[i][j].score = dv.getUint32(pos, true);
      ret.stages[i][j].type = buf[pos + 0x6];
      ret.stages[i][j].cpu = buf[pos + 0x7];
      ret.stages[i][j].player = buf[pos + 0x8];
    }
  }
  return ret;
}

function th10(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0xaa, 0xe1);
  decode10(buf0, 0x24, 0x80, 0x3d, 0x7a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x34) ret.date = formatTime(new Date(dv.getUint32(0x30, true) * 1000));
  if (len >= 0x38) ret.score = dv.getUint32(0x34, true);
  ret.type = buf[0x74];
  ret.sub = buf[0x78];
  ret.difficulty = buf[0x7c];
  ret.clears = buf[0x80];
  const cnt = buf[0x70];
  let pos = 0x88;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x1c >= len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0xc, true);
    ret.stages[i].power = dv.getUint32(pos + 0x10, true);
    ret.stages[i].piv = dv.getUint32(pos + 0x14, true);
    ret.stages[i].player = buf[pos + 0x1c];
    pos += dv.getUint32(pos + 0x8, true) + 0x1c4;
  }
  return ret;
}

function th11(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x800, 0xaa, 0xe1);
  decode10(buf0, 0x24, 0x40, 0x3d, 0x7a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0x80];
  ret.sub = buf[0x84];
  ret.difficulty = buf[0x88];
  ret.clears = buf[0x8c];
  const cnt = buf[0x7c];
  let pos = 0x94;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x38 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0xc, true);
    ret.stages[i].power = dv.getUint32(pos + 0x10, true);
    ret.stages[i].piv = dv.getUint32(pos + 0x14, true);
    ret.stages[i].player = buf[pos + 0x18];
    ret.stages[i].piece = buf[pos + 0x1a];
    ret.stages[i].graze = dv.getUint32(pos + 0x34, true);
    pos += dv.getUint32(pos + 0x8, true) + 0x90;
  }
  return ret;
}

function th12(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x800, 0x5e, 0xe1);
  decode10(buf0, 0x24, 0x40, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0x80];
  ret.sub = buf[0x84];
  ret.difficulty = buf[0x88];
  ret.clears = buf[0x8c];
  const cnt = buf[0x7c];
  let pos = 0x94;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x48 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0xc, true);
    ret.stages[i].power = dv.getUint32(pos + 0x10, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0x14, true) / 1000);
    ret.stages[i].player = buf[pos + 0x18];
    ret.stages[i].piece = buf[pos + 0x1a];
    if (ret.stages[i].piece) ret.stages[i].piece--;
    ret.stages[i].bomb = buf[pos + 0x1c];
    ret.stages[i].biece = buf[pos + 0x1e] / 2;
    ret.stages[i].graze = dv.getUint32(pos + 0x44, true);
    pos += dv.getUint32(pos + 0x8, true) + 0xa0;
  }
  return ret;
}

function th128(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x800, 0x5e, 0xe7);
  decode10(buf0, 0x24, 0x80, 0x7d, 0x36);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0x80];
  ret.difficulty = buf[0x88];
  ret.clears = buf[0x8c];
  const cnt = buf[0x7c];
  let pos = 0x94;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x8c > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0xc, true);
    // ret.stages[i].graze = dv.getUint32(pos + 0x28, true);
    ret.stages[i].motivation = Math.floor(dv.getUint32(pos + 0x80, true) / 100);
    ret.stages[i].pf = Math.floor(dv.getUint32(pos + 0x84, true) / 100);
    ret.stages[i].area = Math.floor(dv.getFloat32(pos + 0x88, true));
    pos += dv.getUint32(pos + 0x8, true) + 0x90;
  }
  return ret;
}

function th13(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x24, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0x80];
  ret.difficulty = buf[0x88];
  ret.clears = buf[0x8c];
  if (len >= 0x98) ret.spellNo = dv.getInt32(0x94, true);
  const cnt = buf[0x7c];
  let pos = 0x98;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x68 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x1c, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x2c, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0x38, true) / 1000);
    ret.stages[i].power = dv.getUint32(pos + 0x44, true);
    ret.stages[i].player = dv.getUint32(pos + 0x50, true);
    ret.stages[i].piece = dv.getUint32(pos + 0x54, true);
    ret.stages[i].extend = dv.getUint32(pos + 0x58, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0x5c, true);
    ret.stages[i].biece = dv.getUint32(pos + 0x60, true);
    ret.stages[i].trance = dv.getUint32(pos + 0x64, true);
    pos += dv.getUint32(pos + 0x8, true) + 0xc4;
  }
  return ret;
}

function th14(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x24, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0xa0];
  ret.sub = buf[0xa4];
  ret.difficulty = buf[0xa8];
  ret.clears = buf[0xac];
  if (len >= 0xb8) ret.spellNo = dv.getInt32(0xb4, true);
  const cnt = buf[0x9c];
  let pos = 0xb8;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x64 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x1c, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x2c, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0x38, true) / 1000);
    ret.stages[i].power = dv.getUint32(pos + 0x44, true);
    ret.stages[i].player = dv.getUint32(pos + 0x50, true);
    ret.stages[i].piece = dv.getUint32(pos + 0x54, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0x5c, true);
    ret.stages[i].biece = dv.getUint32(pos + 0x60, true);
    pos += dv.getUint32(pos + 0x8, true) + 0xdc;
  }
  return ret;
}

function th15(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x24, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0xb0];
  ret.difficulty = buf[0xb8];
  ret.clears = buf[0xbc];
  if (len >= 0xc8) ret.spellNo = dv.getInt32(0xc4, true);
  const cnt = buf[0xac];
  let pos = 0xc8;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x88 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x30, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x40, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0x58, true) / 1000);
    ret.stages[i].power = dv.getUint32(pos + 0x64, true);
    ret.stages[i].player = dv.getUint32(pos + 0x74, true);
    ret.stages[i].piece = dv.getUint32(pos + 0x78, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0x80, true);
    ret.stages[i].biece = dv.getUint32(pos + 0x84, true);
    pos += dv.getUint32(pos + 0x8, true) + 0x238;
  }
  return ret;
}

function th16(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x24, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x38) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x30, true)) * 1000));
  if (len >= 0x3c) ret.score = dv.getUint32(0x38, true);
  ret.type = buf[0xa8];
  ret.difficulty = buf[0xb0];
  ret.clears = buf[0xb4];
  if (len >= 0xc0) ret.spellNo = dv.getInt32(0xbc, true);
  ret.season = buf[0xc0];
  const cnt = buf[0xa4];
  let pos = 0xc4;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x90 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x34, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x44, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0x5c, true) / 1000);
    ret.stages[i].power = dv.getUint32(pos + 0x68, true);
    ret.stages[i].player = dv.getUint32(pos + 0x78, true);
    // ret.stages[i].piece = dv.getUint32(pos + 0x7c, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0x84, true);
    ret.stages[i].biece = dv.getUint32(pos + 0x88, true);
    ret.stages[i].season = dv.getUint32(pos + 0x8c, true);
    pos += dv.getUint32(pos + 0x8, true) + 0x294;
  }
  return ret;
}

function th17(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x24, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x3c) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x34, true)) * 1000));
  if (len >= 0x40) ret.score = dv.getUint32(0x3c, true);
  ret.type = buf[0xac];
  ret.sub = buf[0xb0];
  ret.difficulty = buf[0xb4];
  ret.clears = buf[0xb8];
  if (len >= 0xc4) ret.spellNo = dv.getInt32(0xc0, true);
  const cnt = buf[0xa8];
  let pos = 0xc4;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x8c > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x34, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x44, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0x5c, true) / 1000);
    ret.stages[i].power = dv.getUint32(pos + 0x68, true);
    ret.stages[i].player = dv.getUint32(pos + 0x78, true);
    ret.stages[i].piece = dv.getUint32(pos + 0x7c, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0x84, true);
    ret.stages[i].biece = dv.getUint32(pos + 0x88, true);
    pos += dv.getUint32(pos + 0x8, true) + 0x158;
  }
  return ret;
}

function th18(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x24, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x24, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x24);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x24, 0x2d)).replace(/[ \0]*$/, "");
  if (len >= 0x3c) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x34, true)) * 1000));
  if (len >= 0x40) ret.score = dv.getUint32(0x3c, true);
  ret.type = buf[0xd0];
  ret.difficulty = buf[0xd8];
  ret.clears = buf[0xdc];
  if (len >= 0xe8) ret.spellNo = dv.getInt32(0xe4, true);
  const cnt = buf[0xcc];
  let pos = 0xec;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0xec > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x88, true);
    ret.stages[i].graze = dv.getUint32(pos + 0x98, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0xb0, true) / 1000);
    ret.stages[i].power = dv.getUint32(pos + 0xc4, true);
    ret.stages[i].player = dv.getUint32(pos + 0xd4, true);
    ret.stages[i].piece = dv.getUint32(pos + 0xd8, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0xe4, true);
    ret.stages[i].biece = dv.getUint32(pos + 0xe8, true);
    if (pos + 0x9ec > len) break;
    // ret.stages[i].end_score = dv.getUint32(pos + 0x988, true);
    ret.stages[i].end_graze = dv.getUint32(pos + 0x998, true);
    ret.stages[i].end_piv = Math.floor(dv.getUint32(pos + 0x9b0, true) / 1000);
    ret.stages[i].end_power = dv.getUint32(pos + 0x9c4, true);
    ret.stages[i].end_player = dv.getUint32(pos + 0x9d4, true);
    ret.stages[i].end_piece = dv.getUint32(pos + 0x9d8, true);
    ret.stages[i].end_bomb = dv.getUint32(pos + 0x9e4, true);
    ret.stages[i].end_biece = dv.getUint32(pos + 0x9e8, true);
    pos += dv.getUint32(pos + 0x8, true) + 0x126c;
  }
  return ret;
}

function th20(rpy) {
  const buf0 = rpy.slice();
  decode10(buf0, 0x30, 0x400, 0x5c, 0xe1);
  decode10(buf0, 0x30, 0x100, 0x7d, 0x3a);
  const buf = decompress7(buf0, 0x30);
  const len = buf.length;
  const ret = {};
  const dv = new DataView(buf.buffer);
  ret.name = new TextDecoder().decode(buf.slice(0x30, 0x39)).replace(/[ \0]*$/, "");
  if (len >= 0x48) ret.date = formatTime(new Date(Number(dv.getBigUint64(0x40, true)) * 1000));
  if (len >= 0x4c) ret.score = dv.getUint32(0x48, true);
  ret.type = buf[0x108];
  ret.sub = buf[0x10c];
  ret.difficulty = buf[0x120];
  ret.clears = buf[0x124];
  if (len >= 0x130) ret.spellNo = dv.getInt32(0x12c, true);
  const cnt = buf[0x104];
  let pos = 0x130;
  ret.stages = [];
  for (let j = 0; j < cnt; j++) {
    if (pos + 0x144 > len) break;
    const i = buf[pos] - 1;
    ret.stages[i] = {};
    ret.stages[i].score = dv.getUint32(pos + 0x70, true);
    ret.stages[i].piv = Math.floor(dv.getUint32(pos + 0xb4, true) / 50);
    ret.stages[i].power = dv.getUint32(pos + 0xa0, true);
    ret.stages[i].player = dv.getUint32(pos + 0x128, true);
    ret.stages[i].piece = dv.getUint32(pos + 0x130, true);
    ret.stages[i].bomb = dv.getUint32(pos + 0x13c, true);
    ret.stages[i].biece = dv.getUint32(pos + 0x140, true);
    pos += dv.getUint32(pos + 0xc, true) + 0x2a0;
  }
  return ret;
}
