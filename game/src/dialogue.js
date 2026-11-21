(() => {
  'use strict';
  function typewriter(ctx, name, message, progress, x, y, width) {
    ctx.fillStyle = 'rgba(13,23,26,.95)';
    ctx.fillRect(x, y, width, 120);
    ctx.fillStyle = '#eabf64';
    ctx.fillRect(x, y, 7, 120);
    ctx.font = 'bold 13px Arial';
    ctx.fillText(name.toUpperCase(), x + 24, y + 26);
    ctx.fillStyle = '#f4eddb';
    ctx.font = '17px Arial';
    const shown = message.slice(0, Math.floor(progress * message.length));
    const words = shown.split(' ');
    let line = '';
    let lineY = y + 57;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width - 52) {
        ctx.fillText(line, x + 24, lineY);
        line = word;
        lineY += 22;
      } else line = test;
    }
    if (line) ctx.fillText(line, x + 24, lineY);
    ctx.font = '11px Arial';
    ctx.fillStyle = '#9fa9a3';
    ctx.fillText('ENTER  CONTINUE', x + width - 130, y + 105);
  }

  globalThis.Meridian['dialogue'] = { typewriter };
})();
