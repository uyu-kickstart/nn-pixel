var
chars  = require('./chars'),
fs     = require('fs'),
nn     = require('tiny-nn'),
path   = require('path'),
Canvas = require('canvas');

var
W, H = W = 300;

var
startChar = process.argv[2],
train = process.argv[3],
test = process.argv[4];

if (typeof startChar === 'undefined' ||
    typeof file === 'undefiled' ||
    typeof test  === 'undefined') {
  console.log('[usage]: node check.js [startChar] [train] [test]');
  process.exit(0);
}

startChar = startChar.charCodeAt(0);

var
network = nn.NeuralNetwork.load(JSON.parse(fs.readFileSync(train, 'utf-8')));

var
meta = require(path.join(test, 'meta.json')),
keys = Object.keys(meta),
miss = [];

keys.forEach(function (key) {
  var
  ans = meta[key],
  canvas = new Canvas(W, H),
  buf    = fs.readFileSync(path.join(test, key + '.png')),
  image  = new Canvas.Image,
  ctx, data, rect, mesh, res;

  image.src = buf;
  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  data = ctx.getImageData(0, 0, W, H);
  rect = chars.charRect(data);
  mesh = chars.charMesh(data, rect, 32, 0.1);

  res = String.fromCharCode(nn.maxIndex(network.fire(mesh).O) + startChar);

  console.log(key + '.png: ' + res + ' (' + (res === ans ? 'ok' : 'fail[' + ans + ']') + ')');
  if (res === ans) {
    miss.push(key);
  }
});

console.log((miss.length / keys.length) * 100 + '%');
