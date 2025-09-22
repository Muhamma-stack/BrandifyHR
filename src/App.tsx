import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Briefcase } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles
import logoPng from './components/oflogo.png'; // Corrected the typo in the filename

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1000;

// --- Canvas Helper Functions ---
const drawClippedImage = (ctx: CanvasRenderingContext2D, userImage: HTMLImageElement, clipPath: Path2D, frame: { x: number, y: number, width: number, height: number }, position: { x: number, y: number } = { x: 0, y: 0 }) => {
    ctx.save();
    ctx.clip(clipPath);

    const imgAspectRatio = userImage.width / userImage.height;
    let drawWidth = frame.width;
    let drawHeight = frame.height;
    
    // Cover logic
    if (frame.width / frame.height > imgAspectRatio) {
        drawHeight = frame.width / imgAspectRatio;
    } else {
        drawWidth = frame.height * imgAspectRatio;
    }
    
    // Apply position offset
    const drawX = frame.x - (drawWidth - frame.width) / 2 + position.x;
    const drawY = frame.y - (drawHeight - frame.height) / 2 + position.y;
    
    ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
};

const drawMilestoneTemplate = (
    ctx: CanvasRenderingContext2D,
    params: {
        originalWidth: number;
        originalHeight: number;
        centerX: number;
        centerY: number;
        welcomeData: WelcomeData;
        userImage: HTMLImageElement | null;
        logoImage: HTMLImageElement;
        template: 'probation' | 'anniversary' | 'promotion';
        imagePosition: { x: number, y: number };
    }
) => {
    const { originalWidth, originalHeight, centerX, centerY, welcomeData, userImage, logoImage, template, imagePosition } = params;

    // 1. Background
    ctx.fillStyle = '#0d1d34'; // Deep space blue
    ctx.fillRect(0, 0, originalWidth, originalHeight);
    
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, originalWidth, originalHeight);
    grad.addColorStop(0, 'rgba(29, 42, 68, 0.8)');
    grad.addColorStop(1, 'rgba(13, 29, 52, 0.8)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, originalWidth, originalHeight);
    
    ctx.fillStyle = 'rgba(212, 175, 55, 0.05)'; 
    ctx.beginPath();
    ctx.moveTo(0, originalHeight);
    ctx.lineTo(0, originalHeight - 500);
    ctx.lineTo(600, originalHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Logo
    if (logoImage && logoImage.complete) {
        const logoWidth = 90;
        const logoHeight = logoImage.height * (logoWidth / logoImage.width);
        ctx.drawImage(logoImage, 50, 40, logoWidth, logoHeight);
        ctx.font = '700 30px "Poppins", sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText('Office Field', 155, 40 + logoHeight / 2 + 8);
    }

    // 3. Decorative elements
    ctx.strokeStyle = '#d4af37'; // Gold
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(70, 180);
    ctx.bezierCurveTo(150, 280, 250, 130, 380, 210);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(originalWidth - 70, 130);
    ctx.bezierCurveTo(originalWidth - 150, 230, originalWidth - 250, 80, originalWidth - 380, 160);
    ctx.stroke();
    ctx.globalAlpha = 1.0;


    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 15; j++) {
            ctx.beginPath();
            ctx.arc(originalWidth - 100 + i * 10, originalHeight - 200 + j * 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore();

    // 4. Image Frame and Photo
    const imgRadius = 140;
    const imgCenterX = 240;
    const imgCenterY = centerY + 20;

    const imagePath = new Path2D();
    imagePath.arc(imgCenterX, imgCenterY, imgRadius, 0, Math.PI * 2);
    
    if (welcomeData.image && userImage && userImage.complete) {
        drawClippedImage(ctx, userImage, imagePath, { x: imgCenterX - imgRadius, y: imgCenterY - imgRadius, width: imgRadius * 2, height: imgRadius * 2 }, imagePosition);
    } else {
        ctx.fillStyle = '#333';
        ctx.fill(imagePath);
    }
    
    ctx.strokeStyle = '#d4af37'; 
    ctx.lineWidth = 6;
    ctx.stroke(imagePath);
    
    ctx.strokeStyle = 'white'; 
    ctx.lineWidth = 12;
    ctx.globalAlpha = 0.1;
    ctx.stroke(imagePath);
    ctx.globalAlpha = 1.0;

    // 5. Vertical Separator
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(imgCenterX + imgRadius + 60, centerY - 150);
    ctx.lineTo(imgCenterX + imgRadius + 60, centerY + 250);
    ctx.stroke();

    // 6. Dynamic Text
    const textStartX = imgCenterX + imgRadius + 100;
    const textEndX = originalWidth - 40; // 40px right padding
    let currentY = centerY - 120;
    ctx.textAlign = 'left';

    let mainTitle = '';
    let eventText = '';
    let name = welcomeData.name.toUpperCase();
    let designation = '';
    let message = welcomeData.message || '';

    switch (template) {
        case 'promotion':
            mainTitle = 'Congratulations';
            eventText = 'ON YOUR PROMOTION';
            designation = (welcomeData.newDesignation || welcomeData.designation).toUpperCase();
            break;
        case 'anniversary':
            const year = welcomeData.years || '';
            const suffix = (y: string) => {
                if (!y) return '';
                const n = parseInt(y);
                if (n % 100 >= 11 && n % 100 <= 13) return 'th';
                switch (n % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            };
            mainTitle = `Happy ${year}${suffix(year)} Work`;
            eventText = 'ANNIVERSARY';
            designation = welcomeData.designation.toUpperCase();
            break;
        case 'probation':
            mainTitle = 'Congratulations';
            eventText = 'ON COMPLETING YOUR PROBATION';
            designation = welcomeData.designation.toUpperCase();
            break;
    }

    // Main Title (e.g., "Congratulations") - Right Aligned to the text block
    ctx.textAlign = 'right';
    ctx.font = 'italic 400 55px "Playfair Display", serif';
    ctx.fillStyle = 'white';
    ctx.fillText(mainTitle, textEndX, currentY);
    currentY += 55;
    
    // The rest of the text - Left Aligned
    ctx.textAlign = 'left';
    const maxWidth = textEndX - textStartX;

    if(eventText) {
        ctx.font = '700 22px "Poppins", sans-serif';
        ctx.fillStyle = '#d4af37';
        
        const eventTextLineHeight = 28;
        const eventTextLines = wrapText(ctx, eventText, maxWidth);

        eventTextLines.forEach((line, index) => {
            ctx.fillText(line, textStartX, currentY + (index * eventTextLineHeight));
        });

        const eventTextBlockHeight = eventTextLines.length * eventTextLineHeight;
        currentY += eventTextBlockHeight + (80 - eventTextLineHeight); // Maintain consistent spacing for the next element
    }

    ctx.font = '700 42px "Poppins", sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(name, textStartX, currentY);
    currentY += 40;

    // Designation (now with text wrapping)
    ctx.font = '500 22px "Poppins", sans-serif';
    ctx.fillStyle = '#ccc';
    const designationLineHeight = 26;
    const designationLines = wrapText(ctx, designation, maxWidth);

    designationLines.forEach((line, index) => {
        ctx.fillText(line, textStartX, currentY + (index * designationLineHeight));
    });

    const designationBlockHeight = designationLines.length * designationLineHeight;
    const spacingAfterDesignation = 34; // This plus line height equals original 60px spacing
    currentY += designationBlockHeight + spacingAfterDesignation;


    ctx.font = '400 16px "Poppins", sans-serif';
    ctx.fillStyle = '#ddd';
    const words = message.split(' ');
    let line = '';
    for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), textStartX, currentY);
            line = word + ' ';
            currentY += 22;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line.trim(), textStartX, currentY);

    // 7. Footer
    ctx.font = '500 20px "Poppins", sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('www.officefield.com', centerX, originalHeight - 40);
    ctx.textAlign = 'left';
};

// --- Unified List Rendering Function ---
const renderList = (
  ctx: CanvasRenderingContext2D,
  items: string[],
  startY: number,
  options: {
    layout: 'vertical' | 'horizontal',
    bulletSize: number,
    font: string,
    color: string,
    bulletColor: string,
    lineHeight: number,
    itemSpacing: number,
    startX: number;
    subtitleFont?: string;
    subtitleColor?: string;
    subtitleLineHeight?: number;
    subtitleTopMargin?: number;
  }
): number => {
  let currentY = startY;
  
  if (options.layout === 'vertical') {
    let totalHeight = 0;
    items.forEach(itemText => {
      if (itemText.trim() === '') return;

      const parts = itemText.split('\n');
      const titleText = parts[0];
      const subtitleText = parts.length > 1 ? parts.slice(1).join('\n') : '';

      ctx.font = options.font;
      const titleLines = wrapText(ctx, titleText, CANVAS_WIDTH - options.startX - 40);
      const titleBlockHeight = titleLines.length * options.lineHeight;

      // Draw bullet centered on the FIRST line of the title block text
      ctx.fillStyle = options.bulletColor;
      ctx.beginPath();
      ctx.arc(options.startX, currentY + options.lineHeight / 2, options.bulletSize, 0, 2 * Math.PI);
      ctx.fill();

      // Draw title
      ctx.fillStyle = options.color;
      titleLines.forEach((line, index) => {
        ctx.fillText(line, options.startX + 25, currentY + (index * options.lineHeight) + (options.lineHeight / 2));
      });

      let itemDrawY = currentY + titleBlockHeight + (options.subtitleTopMargin || 0);
      let totalItemHeight = titleBlockHeight;

      // Draw subtitle
      if (subtitleText && options.subtitleFont && options.subtitleColor && options.subtitleLineHeight) {
        ctx.font = options.subtitleFont;
        const subtitleLines = wrapText(ctx, subtitleText, CANVAS_WIDTH - options.startX - 40);
        const subtitleBlockHeight = subtitleLines.length * options.subtitleLineHeight;
        totalItemHeight += (options.subtitleTopMargin || 0) + subtitleBlockHeight;

        ctx.fillStyle = options.subtitleColor;
        const lineHeight = options.subtitleLineHeight;
        subtitleLines.forEach((line, index) => {
           ctx.fillText(line, options.startX + 25, itemDrawY + (index * lineHeight) + (lineHeight / 2));
        });
      }
      
      currentY += totalItemHeight + options.itemSpacing;
      totalHeight += totalItemHeight + options.itemSpacing;
    });
    return totalHeight;
  } else { // Horizontal
    let rowMaxHeight = 0;
    const itemsPerRow = 3;
    const columnWidth = (CANVAS_WIDTH - options.startX) / itemsPerRow;

    items.forEach((item, index) => {
      const col = index % itemsPerRow;
      if (col === 0 && index > 0) {
        currentY += rowMaxHeight + options.itemSpacing;
        rowMaxHeight = 0;
      }
      const x = options.startX + (col * columnWidth);
      const lines = wrapText(ctx, item, columnWidth - 20);
      const textHeight = lines.length * options.lineHeight;
      if (textHeight > rowMaxHeight) {
        rowMaxHeight = textHeight;
      }

      // Draw bullet centered on the first line of text
      ctx.fillStyle = options.bulletColor;
      ctx.beginPath();
      ctx.arc(x, currentY + options.lineHeight / 2, options.bulletSize, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = options.font;
      ctx.fillStyle = options.color;
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, x + 20, currentY + (lineIndex * options.lineHeight) + (options.lineHeight / 2));
      });
    });
    return (currentY + rowMaxHeight) - startY;
  }
};

// --- New Unified Background Drawing Function ---
const drawAppBackground = (ctx: CanvasRenderingContext2D, template: 'dotted' | 'classic') => {
  // Draw new subtle diagonal gradient background from top-left to bottom-right
  const bgGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, '#ebebeb'); // Slightly darker grey for depth near the logo
  bgGradient.addColorStop(1, '#f5f5f5'); // Fading to a very light grey
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw the full-page dot pattern (from the original single post) if the template is 'dotted'
  if (template === 'dotted') {
    const dotRadius = 2;
    const dotSpacing = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Subtle dark dots
    for (let x = 0; x < CANVAS_WIDTH; x += dotSpacing) {
      for (let y = 0; y < CANVAS_HEIGHT; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
};


// --- Canvas Helper Functions ---
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

const renderBenefitsList = (
  ctx: CanvasRenderingContext2D,
  html: string,
  startY: number,
  layout: 'vertical' | 'horizontal'
): number => {
  let currentY = startY;
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');
  const listItems = Array.from(doc.querySelectorAll('li'));

  if (layout === 'vertical') {
    listItems.forEach(item => {
      const itemText = item.innerText;
      if (itemText.trim() === '') return;

      const lines = wrapText(ctx, itemText, CANVAS_WIDTH - 80);
      const itemHeight = lines.length * 20;

      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(50, currentY - 5, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '400 16px Poppins, sans-serif';
      ctx.fillStyle = '#374151';
      lines.forEach((line, index) => {
        ctx.fillText(line, 50 + 15, currentY + (index * 20));
      });
      currentY += itemHeight + 15;
    });
    return currentY - startY;
  } else { // Horizontal
    let rowMaxHeight = 0;
    const benefitsPerRow = 3;
    const benefitColumnWidth = 250;
    const startX = 50; // Use a fixed startX for alignment

    listItems.forEach((item, index) => {
      const col = index % benefitsPerRow;
      if (col === 0 && index > 0) {
        currentY += rowMaxHeight + 15;
        rowMaxHeight = 0;
      }
      const x = 50 + (col * benefitColumnWidth);

      const lines = wrapText(ctx, item.innerText, benefitColumnWidth - 20);
      const textHeight = lines.length * 20;
      if (textHeight > rowMaxHeight) {
        rowMaxHeight = textHeight;
      }

      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.arc(x, currentY - 5, 5, 0, 2 * Math.PI);
      ctx.fill();

      ctx.font = '400 16px Poppins, sans-serif';
      ctx.fillStyle = '#374151';
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, x + 15, currentY + (lineIndex * 20));
      });
    });
    return (currentY + rowMaxHeight) - startY;
  }
};


interface JobOpening {
  id: number;
  title: string;
  experience: string;
}

interface JobData {
  title: string;
  company: string;
  description: string;
  hiringTitle: string; // New field for the main "HIRING" text
  subtitle: string;    // New field for the "MULTIPLE OPENINGS" text
  responsibilities: string;
  requirements: string;
  benefits: string;
  location: string;
  email: string;
  website: string;
}

interface Opening {
  id: number;
  title: string;
  experience: string;
}

interface WelcomeData {
  name: string;
  designation: string;
  image: string | null;
  years?: string;
  newDesignation?: string;
  message?: string;
}

type WelcomeTemplate = 'corporate' | 'creative' | 'modern' | 'elegant' | 'probation' | 'anniversary' | 'promotion';

const JobPostingGenerator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [jobData, setJobData] = useState<JobData>({
    title: 'AI Engineer',
    company: 'OFFICEFIELD',
    description: 'Office Field is looking for a skilled AI Engineer to build, optimize, and deploy high-performance Generative AI and LLM systems serving real users at millisecond latencies.',
    hiringTitle: 'HIRING', // Default value
    subtitle: 'MULTIPLE OPENINGS', // Default value
    responsibilities: '<ul><li><br></li></ul>',
    requirements: '<ul><li><br></li></ul>',
    benefits: '<ul><li>Medical coverage</li><li>Yearly benefits</li><li>Market competitive salary</li><li>Picnic and other team building activities</li><li>Quarterly rewards</li></ul>',
    location: 'KARACHI',
    email: 'JOBS@OFFICEFIELD.COM',
    website: 'www.Officefield.com'
  });

  const [welcomeData, setWelcomeData] = useState<WelcomeData>({
    name: '',
    designation: '',
    image: null,
    years: '',
    newDesignation: '',
    message: '',
  });

  const [previewZoom, setPreviewZoom] = useState<'small' | 'medium' | 'large'>('small');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const [openings, setOpenings] = useState<Opening[]>([
    { id: 1, title: 'Senior Software Engineer - Full Stack [VueJS/NestJS]', experience: 'Experience 4+ Years' },
    { id: 2, title: 'DevOps Engineer', experience: 'Experience 2+ Years' },
    { id: 3, title: 'Senior Software Engineer - iOS', experience: 'Experience 3+ Years' },
    { id: 4, title: 'Data Architect', experience: 'Experience 6+ Years' },
    { id: 5, title: 'Engineering Manager', experience: 'Experience 8+ Years' },
  ]);

  const [activeTab, setActiveTab] = useState<'basic' | 'responsibilities' | 'requirements' | 'benefits' | 'openings'>('basic');
  const [template, setTemplate] = useState<'dotted' | 'classic'>('dotted'); // State for template selection
  const [mode, setMode] = useState<'single' | 'multiple'>('single'); // State for single vs multiple openings
  const [benefitsLayout, setBenefitsLayout] = useState<'horizontal' | 'vertical'>('horizontal'); // State for benefits layout
  const [generatorMode, setGeneratorMode] = useState<'job' | 'welcome'>('job');
  const [welcomeTemplate, setWelcomeTemplate] = useState<WelcomeTemplate>('corporate'); // corporate, creative, modern, elegant
  const [nextId, setNextId] = useState(1);

  // --- Refs for persistent image objects ---
  const logoImg = useRef(new Image()).current;
  const userImg = useRef(new Image()).current;

  const generateImage = (ctx: CanvasRenderingContext2D) => {
    if (mode === 'single') {
      generateSinglePostImage(ctx);
    } else {
      generateMultipleOpeningsImage(ctx);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    if (generatorMode === 'job') {
      link.download = `${jobData.title.replace(/\s+/g, '_')}_hiring_post.png`;
    } else {
      link.download = `${welcomeData.name.replace(/\s+/g, '_')}_welcome_post.png`;
    }
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generateWelcomeImage = (ctx: CanvasRenderingContext2D, template: WelcomeTemplate, userImage: HTMLImageElement, logoImage: HTMLImageElement, imagePosition: { x: number, y: number }) => {
    // Scaling for high-resolution output
    const scale = 2;
    const canvas = ctx.canvas;
    const originalWidth = 800;
    const originalHeight = 1000;
    canvas.width = originalWidth * scale;
    canvas.height = originalHeight * scale;
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, originalWidth, originalHeight);

    const centerX = originalWidth / 2;
    const centerY = originalHeight / 2 + 20;

    // --- Template-specific rendering ---
    switch (template) {
      case 'probation':
      case 'anniversary':
      case 'promotion':
        drawMilestoneTemplate(ctx, {
            originalWidth,
            originalHeight,
            centerX,
            centerY,
            welcomeData,
            userImage,
            logoImage,
            template,
            imagePosition,
        });
        return; // Exit after drawing, as this template is self-contained

      case 'creative':
        // --- Creative Background ---
        const creativeGradient = ctx.createLinearGradient(0, originalHeight, originalWidth, 0);
        creativeGradient.addColorStop(0, '#0d9488'); // Teal
        creativeGradient.addColorStop(1, '#312e81'); // Indigo
        ctx.fillStyle = creativeGradient;
        ctx.fillRect(0, 0, originalWidth, originalHeight);

        // Decorative Blobs
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, 200);
        ctx.bezierCurveTo(150, 50, 350, 450, 0, originalHeight);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(originalWidth, 100);
        ctx.bezierCurveTo(originalWidth - 300, 300, originalWidth, 500, originalWidth, originalHeight);
        ctx.closePath();
        ctx.fill();
        break;

      case 'modern':
        // --- Modern Background (New Design) ---
        ctx.fillStyle = '#262626'; // Dark Gray
        ctx.fillRect(0, 0, originalWidth, originalHeight);

        // --- Gold Speckles ---
        ctx.save();
        for (let i = 0; i < 150; i++) {
          const x = Math.random() * originalWidth;
          const y = Math.random() * originalHeight;
          const radius = Math.random() * 0.8;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 215, 0, 0.5)`; // Faint Gold
          ctx.fill();
        }
        ctx.restore();
        break;

      case 'elegant':
        // --- Elegant Background (New Design) ---
        ctx.fillStyle = '#1c1c1c'; // Deep charcoal
        ctx.fillRect(0, 0, originalWidth, originalHeight);
        
        // Subtle texture
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < originalWidth; i += 4) {
          for (let j = 0; j < originalHeight; j += 4) {
            if ((i + j) % 8 === 0) {
              ctx.fillRect(i, j, 2, 2);
            }
          }
        }
        ctx.restore();
        break;

      case 'corporate':
      default:
        // --- Corporate Background ---
        const bgGradient = ctx.createLinearGradient(0, 0, originalWidth, originalHeight);
        bgGradient.addColorStop(0, '#701a75'); // Fuchsia-ish purple
        bgGradient.addColorStop(1, '#172554'); // Darker Navy
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, originalWidth, originalHeight);

        // Faint angular pattern for texture
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 0.7;
        for (let i = -originalWidth; i < originalWidth * 1.5; i += 30) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 400, originalHeight);
          ctx.stroke();
        }
        ctx.restore();
        break;
    }

    // --- Stars (only for corporate) ---
    if (template === 'corporate') {
      ctx.fillStyle = '#facc15'; // Gold color
      for (let i = 0; i < 150; i++) {
          const x = Math.random() * originalWidth;
          const y = Math.random() * (originalHeight / 2.5); // Concentrate stars in the upper part
          const radius = Math.random() * 2.5 + 1;
          const starPoints = 5;
          const innerRadius = radius / 2;
          
          ctx.beginPath();
          for (let j = 0; j < 2 * starPoints; j++) {
              const angle = (Math.PI / starPoints) * j;
              const r = (j % 2 === 0) ? radius : innerRadius;
              ctx.lineTo(x + r * Math.sin(angle), y + r * Math.cos(angle));
          }
          ctx.closePath();
          ctx.fill();
      }
    }

    // --- Header ---
    if (logoImage && logoImage.complete) {
      const logoAspectRatio = logoImage.naturalWidth / logoImage.naturalHeight;
      const logoWidth = 150;
      const logoHeight = logoWidth / logoAspectRatio;
      ctx.drawImage(logoImage, 40, 40, logoWidth, logoHeight);
    }

    // Welcome Text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '900 64px Poppins, sans-serif';
    ctx.fillText('WELCOME', originalWidth / 2, 200);
    ctx.font = '500 42px Poppins, sans-serif';
    ctx.fillText('TO THE TEAM.', originalWidth / 2, 260);

    // --- Image Frame and Picture ---
    const outerRadius = 160;

    if (template === 'modern') {
      // --- Rounded Rectangle Frame with Arcs (New Design) ---
      const rectWidth = 300;
      const rectHeight = 400;
      const rectX = centerX - rectWidth / 2;
      const rectY = centerY - rectHeight / 2 - 50;
      const cornerRadius = 20;

      // Clip for the image
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rectX + cornerRadius, rectY);
      ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
      ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
      ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
      ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
      ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
      ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
      ctx.lineTo(rectX, rectY + cornerRadius);
      ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
      ctx.closePath();
      ctx.clip();
      
      // Draw user image
      if (welcomeData.image && userImage && userImage.complete) {
        const imgAspectRatio = userImage.width / userImage.height;
        let drawWidth = rectWidth;
        let drawHeight = rectHeight;
        
        if (rectWidth / rectHeight > imgAspectRatio) {
            drawHeight = rectWidth / imgAspectRatio;
        } else {
            drawWidth = rectHeight * imgAspectRatio;
        }
        
        ctx.drawImage(userImage, centerX - drawWidth / 2 + imagePosition.x, rectY - (drawHeight - rectHeight) / 2 + imagePosition.y, drawWidth, drawHeight);
      } else {
        ctx.fillStyle = '#404040';
        ctx.fill();
      }
      ctx.restore(); // Restore from clipping

      // --- Decorative Arcs ---
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, rectY + rectHeight, 100, Math.PI * 1.1, Math.PI * 1.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX, rectY + rectHeight, 100, Math.PI * 1.6, Math.PI * 1.9);
      ctx.stroke();

    } else if (template === 'elegant') {
      // --- Elegant Framed Picture (New Design) ---
      const imgWidth = 350;
      const imgHeight = 450;
      const imgX = centerX - imgWidth / 2;
      const imgY = centerY - imgHeight / 2 - 80;

      // Draw the image
      const imagePath = new Path2D();
      imagePath.rect(imgX, imgY, imgWidth, imgHeight);

      if (welcomeData.image && userImage && userImage.complete) {
        drawClippedImage(ctx, userImage, imagePath, {x: imgX, y: imgY, width: imgWidth, height: imgHeight}, imagePosition);
      } else {
        ctx.fillStyle = '#333';
        ctx.fill(imagePath);
      }
      
      // Draw the decorative frame
      ctx.strokeStyle = '#d4af37'; // Old Gold color
      ctx.lineWidth = 2;
      ctx.strokeRect(imgX - 10, imgY - 10, imgWidth + 20, imgHeight + 20);
      
      // Corner flourishes
      const flourish = (x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(10, 10, 0, 20);
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10, 10, 0, 20);
        ctx.stroke();
        ctx.restore();
      };

      flourish(imgX - 10, imgY - 10, 0);
      flourish(imgX + imgWidth + 10, imgY - 10, 90);
      flourish(imgX + imgWidth + 10, imgY + imgHeight + 10, 180);
      flourish(imgX - 10, imgY + imgHeight + 10, 270);

    } else {
      // --- Circular Image Frame (Corporate & Creative) ---
      // Draw outer white circle
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Decorative arcs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius + 20, Math.PI * 0.75, Math.PI * 1.25);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius + 20, Math.PI * 1.75, Math.PI * 0.25);
      ctx.stroke();

      // Draw inner yellow circle as a fallback background
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius - 3, 0, Math.PI * 2);
      ctx.fill();

      // Clip and draw user image
      if (welcomeData.image && userImage && userImage.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius - 4, 0, Math.PI * 2);
        ctx.clip();

        const circleDiameter = (outerRadius - 4) * 2;
        const imgAspectRatio = userImage.width / userImage.height;
        
        let drawWidth, drawHeight;

        // "Cover" logic: Scale the image to fill the circular area without distortion.
        if (imgAspectRatio < 1) {
          // Portrait or square image: Make width match the circle diameter
          drawWidth = circleDiameter;
          drawHeight = circleDiameter / imgAspectRatio;
        } else {
          // Landscape image: Make height match the circle diameter
          drawHeight = circleDiameter;
          drawWidth = circleDiameter * imgAspectRatio;
        }
        
        const drawX = centerX - drawWidth / 2 + imagePosition.x;
        const drawY = centerY - drawHeight / 2 + imagePosition.y;

        ctx.drawImage(userImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.textAlign = 'center'
        ctx.font = '16px Poppins, sans-serif';
        ctx.fillText('Upload an image', centerX, centerY);
      }
    }

    // --- Employee Info ---
    ctx.textAlign = 'center';

    switch (template) {
      case 'elegant':
        const elegantTextY = centerY + 250;
        ctx.font = '700 64px "Times New Roman", serif';
        ctx.fillStyle = 'white';
        ctx.fillText(welcomeData.name, centerX, elegantTextY);

        ctx.font = '400 24px "Times New Roman", serif';
        ctx.fillStyle = '#d4af37'; // Old Gold
        ctx.fillText(welcomeData.designation, centerX, elegantTextY + 55);
        
        ctx.globalAlpha = 0.8;
        ctx.font = 'italic 300 28px "Times New Roman", serif';
        ctx.fillStyle = '#e5e5e5';
        ctx.fillText('Welcome to the Team', centerX, centerY - 220);
        ctx.globalAlpha = 1.0;
        break;

      case 'modern':
        const modernTextY = centerY + 180;
        ctx.font = '300 24px Poppins, sans-serif';
        ctx.fillStyle = '#e5e5e5';
        ctx.fillText('WELCOME TO THE TEAM', centerX, modernTextY);

        ctx.font = '900 64px Poppins, sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText(welcomeData.name.toUpperCase(), centerX, modernTextY + 60);
        
        ctx.font = '400 22px Poppins, sans-serif';
        ctx.fillStyle = '#ffd700'; // Gold designation
        ctx.fillText(welcomeData.designation, centerX, modernTextY + 110);
        break;
      
      case 'creative':
      case 'corporate':
      default:
        // Name
        ctx.fillStyle = '#facc15';
        ctx.font = '900 60px Poppins, sans-serif';
        ctx.fillText(welcomeData.name.toUpperCase(), centerX, centerY + outerRadius + 100);

        // Designation with background
        ctx.font = '700 20px Poppins, sans-serif';
        const designationText = welcomeData.designation.toUpperCase();
        const designationMetrics = ctx.measureText(designationText);
        const designationWidth = designationMetrics.width;
        const designationHeight = 36;
        const designationY = centerY + outerRadius + 140;
        
        // Rounded rectangle background
        ctx.fillStyle = 'white';
        const rectX = centerX - designationWidth / 2 - 20;
        const rectWidth = designationWidth + 40;
        const borderRadius = designationHeight / 2;
        ctx.beginPath();
        ctx.moveTo(rectX + borderRadius, designationY);
        ctx.lineTo(rectX + rectWidth - borderRadius, designationY);
        ctx.quadraticCurveTo(rectX + rectWidth, designationY, rectX + rectWidth, designationY + borderRadius);
        ctx.lineTo(rectX + rectWidth, designationY + designationHeight - borderRadius);
        ctx.quadraticCurveTo(rectX + rectWidth, designationY + designationHeight, rectX + rectWidth - borderRadius, designationY + designationHeight);
        ctx.lineTo(rectX + borderRadius, designationY + designationHeight);
        ctx.quadraticCurveTo(rectX, designationY + designationHeight, rectX, designationY + designationHeight - borderRadius);
        ctx.lineTo(rectX, designationY + borderRadius);
        ctx.quadraticCurveTo(rectX, designationY, rectX + borderRadius, designationY);
        ctx.closePath();
        ctx.fill();

        // Designation Text
    ctx.fillStyle = '#1e3a8a';
        ctx.fillText(designationText, centerX, designationY + 24);
        break;
    }

    // --- Footer ---
    ctx.fillStyle = 'white';
    if(template === 'modern'){
      ctx.fillStyle = '#d1d5db';
    }
    ctx.font = '500 20px Poppins, sans-serif';
    ctx.fillText(jobData.website, centerX, originalHeight - 60);

    // Thin border lines (Corporate only for now)
    if (template === 'corporate') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      const lineY = originalHeight - 120;
      ctx.beginPath();
      ctx.moveTo(60, lineY);
      ctx.lineTo(originalWidth - 60, lineY);
      ctx.stroke();
    }
  };

  const generateSinglePostImage = (ctx: CanvasRenderingContext2D) => {
    // Scaling for high-resolution output
    const scale = 2;
    const canvas = ctx.canvas;
    canvas.width = CANVAS_WIDTH * scale;
    canvas.height = CANVAS_HEIGHT * scale;
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawAppBackground(ctx, template);

    // --- Header ---
    const logoImg = new Image();
    logoImg.src = logoPng; // Use the imported logo path
    logoImg.onload = () => {
      const logoWidth = 100;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const logoX = 50;
      const logoY = (120 - logoHeight) / 2; // Vertically center the logo in a 120px tall header area
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // Separator line
      const separatorX = logoX + logoWidth + 20;
      ctx.strokeStyle = '#e5e7eb'; // Light gray
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(separatorX, 40);
      ctx.lineTo(separatorX, 80);
      ctx.stroke();

      // Company Name
      ctx.fillStyle = '#1e3a8a'; // Navy Blue
      ctx.font = 'bold 24px Poppins, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(jobData.company, separatorX + 20, 60);
    };


    // Hiring text
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 48px Poppins, sans-serif'; // Bolder font
    ctx.fillText('HIRING', 50, 150);

    // --- Dynamic Job Title Background ---
    // 1. Set the font and measure the text width
    const titleFont = 'bold 24px Poppins, sans-serif';
    ctx.font = titleFont;
    const titleText = jobData.title;
    const titleTextMetrics = ctx.measureText(titleText);
    const titleTextWidth = titleTextMetrics.width;

    // 2. Calculate dynamic width for the rectangle with padding
    const titleRectPadding = 20;
    const titleRectWidth = titleTextWidth + titleRectPadding * 2;
    const titleRectY = 175; // Increased Y position for more space
    const titleRectHeight = 40;
    
    // 3. Draw the dynamic rectangle
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(50, titleRectY, titleRectWidth, titleRectHeight);

    // Job title
    ctx.fillStyle = '#ffffff';
    ctx.font = titleFont; // Ensure font is the same
    ctx.textBaseline = 'middle'; // Explicitly set for perfect centering
    ctx.fillText(titleText, 50 + titleRectPadding, titleRectY + titleRectHeight / 2);

    let currentY = 245; // Adjusted starting Y for content below

    // Description
    if (jobData.description) {
      ctx.fillStyle = '#374151';
      ctx.font = '500 16px Poppins, sans-serif'; // Ensure 500 weight
      const descriptionLines = wrapText(ctx, jobData.description.replace(/<[^>]+>/g, '\n'), CANVAS_WIDTH - 100);
      descriptionLines.forEach((line, index) => {
        ctx.fillText(line, 50, currentY + (index * 20));
      });
      currentY += descriptionLines.length * 20 + 20;
    }

    // Responsibilities
    if (jobData.responsibilities) {
      const listItems = new DOMParser().parseFromString(jobData.responsibilities, 'text/html').querySelectorAll('li');
      const items = Array.from(listItems).map(li => li.innerText);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 24px Poppins, sans-serif';
      ctx.fillText('RESPONSIBILITIES:', 50, currentY);
      currentY += 40;
      const listHeight = renderList(ctx, items, currentY, {
        layout: 'vertical', bulletSize: 5, font: '500 14px Poppins, sans-serif', color: '#374151',
        bulletColor: '#1e3a8a', lineHeight: 20, itemSpacing: 8, startX: 60
      });
      currentY += listHeight + 20;
    }

    // Requirements
    if (jobData.requirements) {
      const listItems = new DOMParser().parseFromString(jobData.requirements, 'text/html').querySelectorAll('li');
      const items = Array.from(listItems).map(li => li.innerText);
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 24px Poppins, sans-serif';
      ctx.fillText('REQUIREMENTS:', 50, currentY);
      currentY += 40;
      const listHeight = renderList(ctx, items, currentY, {
        layout: 'vertical', bulletSize: 5, font: '500 14px Poppins, sans-serif', color: '#374151',
        bulletColor: '#1e3a8a', lineHeight: 20, itemSpacing: 8, startX: 60
      });
      currentY += listHeight + 30;
    }

    // Benefits section
    const benefitItemsHTML = new DOMParser().parseFromString(jobData.benefits, 'text/html').querySelectorAll('li');
    const benefitItems = Array.from(benefitItemsHTML).map(li => li.innerText);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 18px Poppins, sans-serif';
    ctx.fillText('BENEFITS OFFERED:', 50, currentY);
      currentY += 35;
    const benefitsHeight = renderList(ctx, benefitItems, currentY, {
      layout: benefitsLayout, bulletSize: 5, font: '500 16px Poppins, sans-serif', color: '#374151',
      bulletColor: '#1e3a8a', lineHeight: 20, itemSpacing: 15, startX: 60
    });
    currentY += benefitsHeight + 30;

    // Footer section (Simple Bar Design)
    const footerTopY = CANVAS_HEIGHT - 50;

    // Draw dark blue footer background for the bottom section ONLY
        ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, footerTopY, CANVAS_WIDTH, 50);

    // Draw thick white line on top of the footer background
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
        ctx.beginPath();
    ctx.moveTo(0, footerTopY);
    ctx.lineTo(CANVAS_WIDTH, footerTopY);
    ctx.stroke();

    // Contact information in bottom line
    const contactBarCenterY = footerTopY + 28; // Adjusted for perfect visual centering
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Poppins, sans-serif';
    ctx.textBaseline = 'middle'; // Align text vertically to the center
    
    // Email (left)
    ctx.textAlign = 'left';
    ctx.fillText(jobData.email, 50, contactBarCenterY);
    
    // Location (center)
    ctx.textAlign = 'center';
    ctx.fillText(`LOCATION: ${jobData.location}`, CANVAS_WIDTH/2, contactBarCenterY);
    
    // Website (right)
    ctx.textAlign = 'right';
    ctx.fillText(jobData.website, CANVAS_WIDTH - 50, contactBarCenterY);
    
    ctx.textBaseline = 'alphabetic'; // Reset baseline and alignment for other potential drawings
    ctx.textAlign = 'left';
  };

  const generateMultipleOpeningsImage = (ctx: CanvasRenderingContext2D) => {
    const canvas = ctx.canvas;
    const scaleFactor = 2;
    canvas.width = CANVAS_WIDTH * scaleFactor;
    canvas.height = CANVAS_HEIGHT * scaleFactor;
    ctx.scale(scaleFactor, scaleFactor);
    ctx.textBaseline = 'middle';


    // Clear canvas and draw new background
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawAppBackground(ctx, 'dotted'); // Multiple openings always has dotted background for now


    // --- Draw Header (Synced with Single Post) ---
    const logoImg = new Image();
    logoImg.src = logoPng;
    logoImg.onload = () => {
      const logoWidth = 100;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const logoX = 50;
      const logoY = (120 - logoHeight) / 2; // Vertically center the logo
      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // Separator line
      const separatorX = logoX + logoWidth + 20;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
    ctx.beginPath();
      ctx.moveTo(separatorX, 40);
      ctx.lineTo(separatorX, 80);
      ctx.stroke();

      // Company Name
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 24px Poppins, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(jobData.company, separatorX + 20, 60);

      // --- Main Content ---
      let currentY = 150;

      // HIRING title (Now fully dynamic)
      const hiringY = currentY;
      ctx.font = '900 36px Poppins, sans-serif';
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText(jobData.hiringTitle, 50, hiringY);

      // MULTIPLE OPENINGS box - Positioned to overlap the HIRING title
      ctx.font = 'bold 20px Poppins, sans-serif';
      const subtitleText = jobData.subtitle;
      const subtitleMetrics = ctx.measureText(subtitleText);
      const subtitleBoxWidth = subtitleMetrics.width + 40;
      const subtitleBoxHeight = 40;
      const subtitleBoxX = 50;
      const subtitleBoxY = hiringY + 12; // Start the box below the vertical center of "HIRING"
      
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(subtitleBoxX, subtitleBoxY, subtitleBoxWidth, subtitleBoxHeight);

    ctx.fillStyle = '#ffffff';
      ctx.fillText(subtitleText, subtitleBoxX + 20, subtitleBoxY + subtitleBoxHeight / 2);
      
      currentY = subtitleBoxY + subtitleBoxHeight + 50; // Set Y for the next element

      // Draw Openings List
      const openingItems = openings.map(o => `${o.title}\nExperience: ${o.experience}`);
      const listHeight = renderList(ctx, openingItems, currentY, {
        layout: 'vertical',
        bulletSize: 8,
        font: 'bold 22px Poppins, sans-serif',
        color: '#111827',
        bulletColor: '#1e3a8a',
        lineHeight: 30,
        itemSpacing: 25,
        startX: 60,
        subtitleFont: '400 18px Poppins, sans-serif',
        subtitleColor: '#6b7280',
        subtitleLineHeight: 25,
        subtitleTopMargin: 8
      });
      currentY += listHeight;


      // --- Draw Benefits (Now dynamically positioned) ---
      currentY += 40; // Add some space after the openings list
      ctx.font = 'bold 20px Poppins, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText('BENEFITS OFFERED:', 50, currentY);
      currentY += 40;

      const benefitsDom = new DOMParser().parseFromString(jobData.benefits, 'text/html');
      const benefitItemsMulti = Array.from(benefitsDom.querySelectorAll('li')).map(li => li.innerText);
      renderList(ctx, benefitItemsMulti, currentY, {
        layout: benefitsLayout,
        bulletSize: 5,
        font: '400 16px Poppins, sans-serif',
        color: '#374151',
        bulletColor: '#111827',
        lineHeight: 20,
        itemSpacing: 15,
        startX: 60
      });

      // --- Footer (Synced with Single Post) ---
      const footerTopY = CANVAS_HEIGHT - 50;

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, footerTopY, CANVAS_WIDTH, 50);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, footerTopY);
      ctx.lineTo(CANVAS_WIDTH, footerTopY);
      ctx.stroke();

      const contactBarCenterY = footerTopY + 28;
    ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Poppins, sans-serif';
      
      ctx.textAlign = 'left';
      ctx.fillText(jobData.email, 50, contactBarCenterY);
      
      ctx.textAlign = 'center';
      ctx.fillText(`LOCATION: ${jobData.location.toUpperCase()}`, CANVAS_WIDTH / 2, contactBarCenterY);
      
      ctx.textAlign = 'right';
      ctx.fillText(jobData.website, CANVAS_WIDTH - 50, contactBarCenterY);
      
      ctx.textAlign = 'left'; // Reset alignment
    };
    logoImg.onerror = () => {
      // Fallback if image fails to load
      ctx.fillStyle = 'red';
      ctx.fillRect(40, 30, 80, 50);
      ctx.fillStyle = 'white';
      ctx.fillText('Logo', 50, 55);
    }
  };
  
  const handleOpeningChange = (id: number, field: 'title' | 'experience', value: string) => {
    setOpenings(openings.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleAddOpening = () => {
    const newId = openings.length > 0 ? Math.max(...openings.map(o => o.id)) + 1 : 1;
    setOpenings([...openings, { id: newId, title: 'New Position', experience: 'Experience Level' }]);
  };

  const handleDeleteOpening = (id: number) => {
    setOpenings(openings.filter(o => o.id !== id));
  };

  const handleWelcomeDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setWelcomeData({ ...welcomeData, [name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setWelcomeData({ ...welcomeData, image: event.target?.result as string });
        setImagePosition({ x: 0, y: 0 }); // Reset position when new image is uploaded
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleQuillChange = (field: 'responsibilities' | 'requirements' | 'benefits', value: string) => {
    setJobData(prev => ({ ...prev, [field]: value }));
  };

  const generateCanvasContent = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (generatorMode === 'job') {
      generateImage(ctx);
    } else {
      generateWelcomeImage(ctx, welcomeTemplate, userImg, logoImg, imagePosition);
    }
  };

  useEffect(() => {
    // This effect handles loading images and triggering redraws
    let logoReady = logoImg.complete;
    let userImageReady = (generatorMode === 'welcome' && welcomeData.image) ? userImg.complete && userImg.src === welcomeData.image : true;

    const onLogoLoad = () => {
      logoReady = true;
      if (userImageReady) generateCanvasContent();
    };
    
    const onUserImgLoad = () => {
      userImageReady = true;
      if (logoReady) generateCanvasContent();
    };

    logoImg.onload = onLogoLoad;
    userImg.onload = onUserImgLoad;
    
    if (logoImg.src !== logoPng) {
        logoImg.src = logoPng;
    }

    if (generatorMode === 'welcome' && welcomeData.image && userImg.src !== welcomeData.image) {
        userImg.src = welcomeData.image;
    }
    
    if (logoReady && userImageReady) {
        generateCanvasContent();
    }
  }, [jobData, welcomeData, template, mode, openings, benefitsLayout, generatorMode, welcomeTemplate, imagePosition]);

  useEffect(() => {
    // When mode changes, reset to a valid tab for that mode to prevent a blank form state
    if (mode === 'multiple' && (activeTab === 'responsibilities' || activeTab === 'requirements')) {
      setActiveTab('basic');
    }
    if (mode === 'single' && activeTab === 'openings') {
      setActiveTab('basic');
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-6">
          <div className="flex items-center">
            <img src={logoPng} alt="BrandifyHR Logo" className="h-10 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">BrandifyHR</h1>
          </div>
        </div>

        {/* --- Generator Mode Switcher (Main Toggle) --- */}
        <div className="flex justify-center border-b mb-4">
          <button onClick={() => setGeneratorMode('job')} className={`px-6 py-2 font-bold ${generatorMode === 'job' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>
            Job Posting
          </button>
          <button onClick={() => setGeneratorMode('welcome')} className={`px-6 py-2 font-bold ${generatorMode === 'welcome' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>
            Welcome Image
          </button>
        </div>
        
        {/* --- Job Posting Specific Controls --- */}
        {generatorMode === 'job' && (
          <div className="flex justify-between items-center mb-4 gap-4">
            {/* Mode Selector */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setMode('single')}
                className={`px-4 py-2 rounded-md font-semibold text-sm ${mode === 'single' ? 'bg-white text-primary shadow' : 'bg-transparent text-gray-600'}`}
              >
                Single Posting
              </button>
              <button
                onClick={() => setMode('multiple')}
                className={`px-4 py-2 rounded-md font-semibold text-sm ${mode === 'multiple' ? 'bg-white text-primary shadow' : 'bg-transparent text-gray-600'}`}
              >
                Multiple Openings
              </button>
            </div>

            {/* Template Selector */}
            <div className="flex space-x-2">
              <button
                onClick={() => setTemplate('dotted')}
                className={`px-4 py-2 rounded-md font-semibold ${template === 'dotted' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Dotted Template
              </button>
              <button
                onClick={() => setTemplate('classic')}
                className={`px-4 py-2 rounded-md font-semibold ${template === 'classic' ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Classic Template
              </button>
            </div>
          </div>
        )}

        {generatorMode === 'job' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
            <div className="flex border-b mb-6">
                {/* --- Universal Tabs --- */}
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 font-semibold ${activeTab === 'basic' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
              >
                <FileText className="inline-block w-4 h-4 mr-2" />
                Basic Info
              </button>

                {/* --- Single Mode Tabs --- */}
                {mode === 'single' && (
                  <>
              <button
                onClick={() => setActiveTab('responsibilities')}
                className={`px-4 py-2 font-semibold ${activeTab === 'responsibilities' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
              >
                <Briefcase className="inline-block w-4 h-4 mr-2" />
                Responsibilities
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-4 py-2 font-semibold ${activeTab === 'requirements' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
              >
                Requirements
              </button>
                  </>
                )}
                
                {/* --- Multiple Mode Tabs --- */}
                {mode === 'multiple' && (
                  <button
                    onClick={() => setActiveTab('openings')}
                    className={`px-4 py-2 font-semibold ${activeTab === 'openings' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
                  >
                    Openings
                  </button>
                )}

                {/* --- Universal Tabs --- */}
              <button
                onClick={() => setActiveTab('benefits')}
                className={`px-4 py-2 font-semibold ${activeTab === 'benefits' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
              >
                Benefits
              </button>
            </div>

            {activeTab === 'basic' && (
              <div className="space-y-4">
                  {mode === 'single' ? (
                    <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    type="text"
                    value={jobData.title}
                    onChange={(e) => setJobData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                </div>
                <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                        <textarea
                          value={jobData.description}
                          onChange={(e) => setJobData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hiring Title</label>
                  <input
                    type="text"
                          value={jobData.hiringTitle}
                          onChange={(e) => setJobData(prev => ({ ...prev, hiringTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                        <input
                          type="text"
                          value={jobData.subtitle}
                          onChange={(e) => setJobData(prev => ({ ...prev, subtitle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                        />
                      </div>
                    </>
                  )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={jobData.company}
                    onChange={(e) => setJobData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={jobData.location}
                      onChange={(e) => setJobData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={jobData.email}
                      onChange={(e) => setJobData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="text"
                    value={jobData.website}
                    onChange={(e) => setJobData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  />
                </div>
              </div>
            )}

              {mode === 'single' && activeTab === 'responsibilities' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsibilities
                </label>
                  <ReactQuill 
                    theme="snow" 
                    value={jobData.responsibilities} 
                    onChange={(value) => handleQuillChange('responsibilities', value)}
                    className="bg-white"
                />
              </div>
            )}

              {mode === 'single' && activeTab === 'requirements' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                </label>
                  <ReactQuill 
                    theme="snow" 
                    value={jobData.requirements} 
                    onChange={(value) => handleQuillChange('requirements', value)}
                    className="bg-white"
                />
              </div>
            )}

            {activeTab === 'benefits' && (
              <div>
                  <div className="flex justify-end items-center mb-2 space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setBenefitsLayout('horizontal')}
                      className={`px-3 py-1 text-sm rounded-md font-semibold ${benefitsLayout === 'horizontal' ? 'bg-white text-primary shadow' : 'bg-transparent text-gray-600'}`}
                    >
                      Horizontal
                    </button>
                    <button
                      onClick={() => setBenefitsLayout('vertical')}
                      className={`px-3 py-1 text-sm rounded-md font-semibold ${benefitsLayout === 'vertical' ? 'bg-white text-primary shadow' : 'bg-transparent text-gray-600'}`}
                    >
                      Vertical
                    </button>
                  </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benefits
                </label>
                  <ReactQuill 
                    theme="snow" 
                    value={jobData.benefits} 
                    onChange={(value) => handleQuillChange('benefits', value)}
                    className="bg-white"
                />
              </div>
            )}

              {mode === 'multiple' && activeTab === 'openings' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-800">Manage Openings</h2>
                  
                  <div className="space-y-4">
                    {openings.map(opening => (
                      <div key={opening.id} className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">Job Title</label>
                          <button onClick={() => handleDeleteOpening(opening.id)} className="text-red-500 hover:text-red-700">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={opening.title}
                          onChange={(e) => handleOpeningChange(opening.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <label className="text-sm font-medium text-gray-700 mt-2 block">Experience</label>
                        <input
                          type="text"
                          value={opening.experience}
                          onChange={(e) => handleOpeningChange(opening.id, 'experience', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={handleAddOpening} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    Add New Opening
                  </button>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Preview</h2>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex bg-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewZoom('small')}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${previewZoom === 'small' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => setPreviewZoom('medium')}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${previewZoom === 'medium' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setPreviewZoom('large')}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${previewZoom === 'large' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                  >
                    L
                  </button>
                </div>
              <button
                onClick={downloadImage}
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </button>
              </div>
            </div>
            
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className={`border border-gray-200 rounded-lg shadow-md aspect-[4/5] ${
                  previewZoom === 'small' ? 'max-w-sm' : 
                  previewZoom === 'medium' ? 'max-w-md' : 
                  'max-w-lg'
                }`}
              />
            </div>
          </div>
        </div>
        )}

        {generatorMode === 'welcome' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-lg p-3 lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-3">Welcome Card Details</h2>
              
              {/* Template Selector */}
              <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Template Style</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
                      {/* Using Array.map for cleaner buttons */}
                      {(['corporate', 'creative', 'modern', 'elegant', 'probation', 'anniversary', 'promotion'] as WelcomeTemplate[]).map((template) => (
                          <button 
                            key={template}
                            onClick={() => setWelcomeTemplate(template)} 
                            className={`w-full text-center px-2 py-1 rounded-md transition-colors text-xs font-semibold capitalize ${welcomeTemplate === template ? 'bg-primary text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                              {template}
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {/* Employee Photo - Spanning full width */}
                  <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1">Employee Photo</label>
                      <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-rose-100 cursor-pointer"
                      />
                  </div>

                  {/* Image Position Controls (only show if image is uploaded) */}
                  {welcomeData.image && (
                      <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Adjust Image Position</label>
                          <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600">X:</label>
                                  <input
                                      type="range"
                                      min="-50"
                                      max="50"
                                      value={imagePosition.x}
                                      onChange={(e) => setImagePosition(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                      className="w-20"
                                  />
                                  <span className="text-xs text-gray-500 w-8">{imagePosition.x}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600">Y:</label>
                                  <input
                                      type="range"
                                      min="-50"
                                      max="50"
                                      value={imagePosition.y}
                                      onChange={(e) => setImagePosition(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                      className="w-20"
                                  />
                                  <span className="text-xs text-gray-500 w-8">{imagePosition.y}</span>
                              </div>
                              <button
                                  onClick={() => setImagePosition({ x: 0, y: 0 })}
                                  className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                              >
                                  Reset
                              </button>
                          </div>
                      </div>
                  )}

                  {/* Employee Name */}
                  <div>
                      <label htmlFor="name" className="block text-xs font-bold text-gray-700 mb-1">Employee Name</label>
                      <input
                          type="text"
                          id="name"
                          name="name"
                          value={welcomeData.name}
                          onChange={handleWelcomeDataChange}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light"
                          placeholder="e.g., Jane Doe"
                      />
                  </div>

                  {/* Designation */}
                  <div>
                      <label htmlFor="designation" className="block text-xs font-bold text-gray-700 mb-1">Designation</label>
                      <input
                          type="text"
                          id="designation"
                          name="designation"
                          value={welcomeData.designation}
                          onChange={handleWelcomeDataChange}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light"
                          placeholder="e.g., Software Engineer"
                      />
                  </div>
                  
                  {/* Conditional Fields */}
                  {welcomeTemplate === 'anniversary' && (
                      <div>
                          <label htmlFor="welcome-years" className="block text-xs font-bold text-gray-700 mb-1">Years of Service</label>
                          <input
                              type="text"
                              id="welcome-years"
                              name="years"
                              value={welcomeData.years || ''}
                              onChange={handleWelcomeDataChange}
                              className="w-full p-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light"
                              placeholder="e.g., 3"
                          />
                      </div>
                  )}

                  {welcomeTemplate === 'promotion' && (
                      <div>
                          <label htmlFor="welcome-new-designation" className="block text-xs font-bold text-gray-700 mb-1">New Designation</label>
                          <input
                              type="text"
                              id="welcome-new-designation"
                              name="newDesignation"
                              value={welcomeData.newDesignation || ''}
                              onChange={handleWelcomeDataChange}
                              className="w-full p-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light"
                              placeholder="e.g., Senior Engineer"
                          />
                      </div>
                  )}
              </div>
              
              {/* Custom Message - Full width below grid */}
              {['probation', 'anniversary', 'promotion'].includes(welcomeTemplate) && (
                  <div className="mt-2">
                      <label htmlFor="welcome-message" className="block text-xs font-bold text-gray-700 mb-1">Custom Message</label>
                      <textarea
                          id="welcome-message"
                          name="message"
                          value={welcomeData.message || ''}
                          onChange={handleWelcomeDataChange}
                          rows={3}
                          className="w-full p-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-primary-light focus:border-primary-light"
                          placeholder="Enter a custom message..."
                      />
                  </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-lg p-2 lg:col-span-3">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-bold text-gray-800">Preview</h2>
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex bg-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewZoom('small')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${previewZoom === 'small' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setPreviewZoom('medium')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${previewZoom === 'medium' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setPreviewZoom('large')}
                      className={`px-2 py-1 text-xs rounded-md transition-colors ${previewZoom === 'large' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}
                    >
                      L
                    </button>
                  </div>
                  <button
                    onClick={downloadImage}
                    className="flex items-center px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download PNG
                  </button>
                </div>
              </div>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className={`bg-white shadow-lg aspect-[4/5] ${
                    previewZoom === 'small' ? 'max-w-sm' : 
                    previewZoom === 'medium' ? 'max-w-md' : 
                    'max-w-lg'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default JobPostingGenerator;