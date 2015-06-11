(function (global) {
  'use strict';

  // ImageDataに描画された文字の位置とサイズを取得する。
  // 返り値は`[x, y, w, h]`の形式
  function charRect(data) {
    var
    t = Infinity, b = 0,
    l = Infinity, r = 0,
    x, y;

    for (y = 0; y < data.height; y++) {
      for (x = 0; x < data.width; x++) {
        if (data.data[(y * data.width + x) * 4 + 3] !== 0) {
          t = Math.min(t, y);
          b = Math.max(b, y);
          l = Math.min(l, x);
          r = Math.max(r, x);
        }
      }
    }

    return [l, t, r - l, b - t];
  }

  // ImageDataに描画された文字の位置とサイズを正方形で取得する。
  // 返り値は`[x, y, w, h]`の形式
  function charSquare(data) {
    var
    rect = charRect(data),
    l = Math.max(rect[2], rect[3]);

    return [rect[0] + Math.floor(rect[2] / 2) - Math.floor(l / 2),
            rect[1] + Math.floor(rect[3] / 2) - Math.floor(l / 2),
            l, l];
  }

  // rectの領域をn×nに区切って、その中の文字の割合がpより大きいかどうかの入った配列（mesh）を返す
  // 配列の要素が1のときpより大きくて、0のとき小さい
  function charMesh(data, rect, n, p) {
    var
    sx = rect[0], sy = rect[1],
    w = rect[2], h = rect[3],
    x, y,
    i, j, k,
    mesh = [];

    for (y = 0; y < h; y++) {
      i = Math.floor(y / h * n);
      for (x = 0; x < w; x++) {
        j = Math.floor(x / w * n);
        k = i * n + j;
        mesh[k] = mesh[k] || 0;
        if (y + sy < 0 || x + sx < 0 ||
            data.height <= y + sy || data.width <= x + sx) continue;
        if (data.data[((y + sy) * data.width + (x + sx)) * 4 + 3]) {
          mesh[k] += 1;
        }
      }
    }

    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        k = y * n + x;
        mesh[k] /= w/n*h/n;
        mesh[k] = mesh[k] > p ? 1 : 0;
      }
    }

    return mesh;
  }

  // meshを整数値にする。
  // meshの長さが32より大きいと死ぬ。
  function meshToInt(mesh) {
    return parseInt(mesh.join(''), 2);
  }

  // 公開
  var
  chars = {
    charRect: charRect,
    charSquare: charSquare,
    charMesh: charMesh,
    meshToInt: meshToInt,
  };
  if (typeof module !== 'undefined') {
    module.exports = chars;
  }

  global.chars = chars;
})((this || 0).self || global);
