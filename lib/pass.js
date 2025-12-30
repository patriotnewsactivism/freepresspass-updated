export function genPassId() {
  return 'pass-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function drawPressPass(canvas, { name, title, photoSrc, passId }) {
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const displayName = name && name.trim() ? name.trim() : 'YOUR NAME HERE';
  const displayTitle = title && title.trim() ? title.trim() : 'INDEPENDENT JOURNALIST';
  const displayId = passId || 'PREVIEW';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer border
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Top header bar
  const headerHeight = 60;
  ctx.fillStyle = '#dc143c';
  ctx.fillRect(5, 5, canvas.width - 10, headerHeight);
  ctx.textAlign = 'center';
  const headerText = 'PRESS CREDENTIAL';
  ctx.font = 'bold 28px "Helvetica", Arial, sans-serif';
  ctx.strokeStyle = '#1a252f';
  ctx.lineWidth = 2;
  ctx.strokeText(headerText, canvas.width / 2, 5 + headerHeight / 2 + 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(headerText, canvas.width / 2, 5 + headerHeight / 2 + 10);

  // Subheading
  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 14px "Helvetica", Arial, sans-serif';
  ctx.fillText('CONSTITUTIONAL PRESS', canvas.width / 2, 5 + headerHeight + 28);

  // Photo and right-hand column
  const photoX = 25;
  const photoY = 140;
  const photoW = 150;
  const photoH = 180;
  const rightX = photoX + photoW + 20;
  const rightW = canvas.width - rightX - 25;
  const rightCenterX = rightX + rightW / 2;
  const photoCenterY = photoY + (photoH / 2);

  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2;
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';

  if (photoSrc && typeof Image !== 'undefined') {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
    };
    img.onerror = () => {
      ctx.font = 'bold 14px "Helvetica", Arial, sans-serif';
      ctx.fillText('PHOTO', photoX + photoW / 2, photoY + photoH / 2);
    };
    img.src = photoSrc;
  } else {
    ctx.font = 'bold 14px "Helvetica", Arial, sans-serif';
    ctx.fillText('PHOTO', photoX + photoW / 2, photoY + photoH / 2);
  }

  // Name and title layout
  const nameWords = displayName.toUpperCase().trim().split(/\s+/);
  const firstName = nameWords[0] || '';
  const lastName = nameWords.slice(1).join(' ') || '';

  let titleLines;
  if (displayTitle && displayTitle.toUpperCase() !== 'INDEPENDENT JOURNALIST') {
    titleLines = displayTitle.toUpperCase().split(/\s+/);
  } else {
    titleLines = ['INDEPENDENT', 'JOURNALIST'];
  }

  const nameLineCount = lastName ? 2 : 1;
  const nameHeight = nameLineCount * 28;
  const titleHeight = titleLines.length * 20;
  const gapBetween = 5;
  const totalHeight = nameHeight + gapBetween + titleHeight;

  let yPos = photoCenterY - (totalHeight / 2);
  ctx.fillStyle = '#2c3e50';
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px "Helvetica", Arial, sans-serif';

  ctx.fillText(firstName, rightCenterX, yPos);
  yPos += 28;

  if (lastName) {
    ctx.fillText(lastName, rightCenterX, yPos);
    yPos += 28;
  }

  yPos += gapBetween;
  ctx.font = 'bold 12px "Helvetica", Arial, sans-serif';
  titleLines.forEach((line) => {
    ctx.fillText(line, rightCenterX, yPos);
    yPos += 20;
  });

  // Metadata section
  let baseY = photoY + photoH + 30;
  ctx.font = '14px "Helvetica", Arial, sans-serif';
  ctx.fillText(`ID: ${displayId}`, canvas.width / 2, baseY);
  baseY += 18;

  ctx.font = 'bold 12px "Helvetica", Arial, sans-serif';
  ctx.fillText('ISSUED BY', canvas.width / 2, baseY);
  baseY += 16;
  ctx.font = 'bold 12px "Helvetica", Arial, sans-serif';
  ctx.fillText('CONSTITUTIONAL PRESS ASSOCIATION', canvas.width / 2, baseY);
  baseY += 18;

  const expDate = new Date(new Date().getFullYear() + 2, 11, 31);
  ctx.fillStyle = '#dc143c';
  ctx.font = 'bold 14px "Helvetica", Arial, sans-serif';
  ctx.fillText(`VALID THROUGH DEC 31, ${expDate.getFullYear()}`, canvas.width / 2, baseY);
  baseY += 26;

  ctx.fillStyle = '#1a252f';
  ctx.font = 'bold 11px "Helvetica", Arial, sans-serif';
  const legalLines = [
    'THIS JOURNALIST IS RECOGNIZED UNDER THE PROTECTIONS',
    'OF THE FIRST AMENDMENT OF THE U.S. CONSTITUTION.',
    'ANY INTERFERENCE WILL BE A VIOLATION OF FEDERAL LAW.'
  ];
  legalLines.forEach((t, i) => {
    ctx.fillText(t, canvas.width / 2, baseY + i * 14);
  });
  baseY += legalLines.length * 14 + 16;

  ctx.fillStyle = '#2c3e50';
  ctx.font = 'bold 10px "Helvetica", Arial, sans-serif';
  const noteLines = [
    'Do not hinder, exclude, or block the view of this journalist',
    'in the exercise of court?`recognized First Amendment rights.'
  ];
  noteLines.forEach((t, i) => {
    ctx.fillText(t, canvas.width / 2, baseY + i * 14);
  });

  return displayId;
}

