import { Polygons } from '@kurgm/kage-engine'
import { drawGlyph } from './glyphwiki_buhin.js'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <input type="text" id="input" placeholder="Enter a Kanji">
    <button id="submit">Submit</button>
    <div id="unicode"></div>
    <div id="kanjiLook"></div>
    <br>
    <canvas id="main-canvas" width="500" height="500" style="border: 1px solid black;"></canvas>
  </div>
`

function getUnicode(kanji: string) {
  return kanji.codePointAt(0)!.toString(16)
}

async function drawKanji(kanji: string, ctx: CanvasRenderingContext2D) {
  // fetch kanji data from local storage, read as html element
  const kanjiData = await fetch(`./kanji/0${getUnicode(kanji)}.svg`).then(res => res.text())
  const kanjiElement = new DOMParser().parseFromString(kanjiData, 'image/svg+xml').documentElement
  ctx.clearRect(0, 0, 500, 500)

  console.log(kanjiElement)
  const kanjiLookElement = document.getElementById('kanjiLook');
  if (kanjiLookElement) {
    kanjiLookElement.innerHTML = kanjiElement.outerHTML;
    if (kanjiElement.outerHTML.search('parsererror') > -1) {
      return;
    }
  }

  const groups = Array.from(kanjiElement.getElementsByTagName('g'));
  const strokes = new Array<number>();
  const temp = new Array<String>();
  const original = groups[1].getAttribute('kvg:element')
  console.log(original)
  Array.from(groups[1].getElementsByTagName('path')).forEach((path: Element) => {
    var child = <Element>path.parentNode!;
    while (child.parentNode
      && (<Element>child.parentNode).getAttribute('kvg:element')
      && (<Element>child.parentNode).getAttribute('kvg:element') !== original)
      child = <Element>child.parentNode;
    const r = child.getAttribute('kvg:element');
    if (r) {
      var idx = 0;
      if (false) { // add special case here
      } else {
        idx = temp.findIndex(e => e === r);
        if (idx === -1) { temp.push(r); idx = temp.length - 1; }
      }
      strokes.push(idx);
    }
  });
  console.log(strokes)
  console.log(temp)

  const array = await drawGlyph("u" + getUnicode(kanji));
  type Box = { minX: number, minY: number, maxX: number, maxY: number };
  const boxes = new Array<Box>();
  console.log(array)
  array.forEach((stroke: Polygons, idx: number) => {
    const svg = stroke.generateSVG(true);
    const image = new Image();
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    image.onload = () => {
      ctx.drawImage(image, 0, 0);
    }

    if (boxes[strokes[idx]] === undefined) {
      boxes[strokes[idx]] = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    }
    for (const polygon of stroke.array) {
      for (const point of polygon) {
        boxes[strokes[idx]].minX = Math.min(boxes[strokes[idx]].minX, point.x);
        boxes[strokes[idx]].minY = Math.min(boxes[strokes[idx]].minY, point.y);
        boxes[strokes[idx]].maxX = Math.max(boxes[strokes[idx]].maxX, point.x);
        boxes[strokes[idx]].maxY = Math.max(boxes[strokes[idx]].maxY, point.y);
      }
    }
  })

  for (const box of boxes) {
    ctx.beginPath();
    ctx.rect(box.minX, box.minY, box.maxX - box.minX, box.maxY - box.minY);
    ctx.stroke();
    ctx.closePath();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit')!.addEventListener('click', () => {
    const kanji = (<HTMLInputElement>document.getElementById('input')!).value
    const unicode = getUnicode(kanji)
    document.getElementById('unicode')!.innerHTML = `u${unicode}`
    drawKanji(kanji, (<HTMLCanvasElement>document.getElementById('main-canvas')!).getContext('2d')!)
  })
})

