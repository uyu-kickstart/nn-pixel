var
chars  = require('./chars'),
fs     = require('fs'),
nn     = require('tiny-nn'),
path   = require('path'),
Canvas = require('canvas');

var
data = process.argv[2],
H_LEN = process.argv[3],
O_LEN = process.argv[4],
startChar = process.argv[5] || '',
LOOP = process.argv[6],
name = process.argv[7],
ETA  = process.argv[8],
network = process.argv[9];

var
W     = 300,
H     = 300,
X_LEN = 1024;

H_LEN = parseInt(H_LEN, 10);
O_LEN = parseInt(O_LEN, 10);
LOOP  = parseInt(LOOP, 10);
ETA   = parseFloat(ETA);
startChar = startChar.charCodeAt(0);

if (process.argv.length < 9 || typeof startChar !== 'number' ||
    !H_LEN || !O_LEN || !LOOP || !ETA) {
  console.log('[usage]: node train.js [data] [H_LEN] [O_LEN] [startChar] [LOOP] [name] [ETA] [network]');
  process.exit(0);
}

var
dataDir = path.dirname(data),
meta = require(data);

console.time('load');
if (Array.isArray(meta)) {
  data = meta.map(function (d) {
    return {
      key: d[0],
      ch: d[0],
      mesh: d[1],
    };
  });
} else {
  data = Object.keys(meta).map(function (key) {
    var
    ch     = meta[key],
    buf    = fs.readFileSync(path.join(dataDir, key + '.png')),
    image  = new Canvas.Image,
    canvas = new Canvas(W, H),
    ctx    = canvas.getContext('2d'),
    d, mesh;

    image.src = buf;

    ctx.drawImage(image, 0, 0);
    d = ctx.getImageData(0, 0, W, H);
    rect = chars.charRect(d);
    mesh = chars.charMesh(d, rect, 32, 0.1);

    return {
      key: key,
      ch: ch,
      mesh: mesh,
    };
  });
}
console.timeEnd('load');

if (network === undefined) {
  network = new nn.NeuralNetwork('sigmoid', 'tanh',
    nn.randomMatrix(H_LEN, X_LEN + 1),
    nn.randomMatrix(O_LEN, H_LEN + 1));
} else {
  network = new nn.NeuralNetwork.load(JSON.parse(fs.readFileSync(network, 'utf-8')));
}

console.time('train');
var
miss = (function () {
  var
  i, p, d, miss, idx, n, k;

  for (i = 1; i <= LOOP; i++) {
    console.time('train' + i);
    p = 0;
    miss = [];
    for (j = 0; j < data.length; j++) {
      d = data[j];
      if (train(d.mesh, d.ch.charCodeAt(0) - startChar)) p++;
      else miss.push(d);
    }
    console.timeEnd('train' + i);
    console.log('train' + i + ': ' + (p / data.length * 100) + '%');
  }

  return miss;

  function train(X, tn) {
    var
    result,
    T = [],
    i;

    for (i = 0; i < O_LEN; i++) T[i] = 0;
    T[tn] = 1;

    result = network.fit(X, T, ETA);

    return nn.maxIndex(result.O) === tn;
  }
})();
console.timeEnd('train');
miss.forEach(function (d) {
  console.log(d.key + ' (' + d.ch + ')');
});

fs.writeFileSync(path.join('train-data', ['train', name, H_LEN].join('-') + '.json'), network.toJSON());
