import React from 'react';

export const HomescreenWallpaper: React.FC = () => {
  return (
    <div
      id="homescreen-wallpaper-container"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#03060e] select-none"
      aria-hidden="true"
    >
      {/* 1. Base Sky Gradient spanning 100% of viewport */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020409] via-[#060d1a] to-[#090b14] transition-opacity duration-1000" />

      {/* 2. Responsive Vector Art matching the user's uploaded wallpaper */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-full h-full object-cover object-center max-w-none transition-transform duration-700"
          viewBox="0 0 1080 1920"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sky Gradients */}
            <linearGradient id="hwSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#020409" />
              <stop offset="35%" stop-color="#070e1c" />
              <stop offset="65%" stop-color="#0c182f" />
              <stop offset="78%" stop-color="#141a2e" />
              <stop offset="88%" stop-color="#1e1828" />
              <stop offset="100%" stop-color="#070a12" />
            </linearGradient>

            {/* Moon Halos */}
            <radialGradient id="hwMoonAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
              <stop offset="25%" stop-color="#d4e8ff" stop-opacity="0.45" />
              <stop offset="50%" stop-color="#96bde8" stop-opacity="0.22" />
              <stop offset="75%" stop-color="#5885b8" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#2a456c" stop-opacity="0" />
            </radialGradient>

            <radialGradient id="hwMoonDisc" cx="42%" cy="40%" r="55%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="65%" stop-color="#e2ecf7" />
              <stop offset="85%" stop-color="#c6d8ec" />
              <stop offset="100%" stop-color="#a6c0dc" />
            </radialGradient>

            {/* Fiery Sunset Mist / Horizon Glow */}
            <radialGradient id="hwCrimsonMistCenter" cx="50%" cy="80%" r="50%">
              <stop offset="0%" stop-color="#ff334b" stop-opacity="0.8" />
              <stop offset="30%" stop-color="#f0386b" stop-opacity="0.6" />
              <stop offset="60%" stop-color="#b82d68" stop-opacity="0.35" />
              <stop offset="85%" stop-color="#5e1f5c" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#181329" stop-opacity="0" />
            </radialGradient>

            <linearGradient id="hwMistHorizon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0d1b33" stop-opacity="0" />
              <stop offset="50%" stop-color="#c83e58" stop-opacity="0.5" />
              <stop offset="75%" stop-color="#f54b64" stop-opacity="0.75" />
              <stop offset="90%" stop-color="#ff6b6b" stop-opacity="0.55" />
              <stop offset="100%" stop-color="#0c0e17" stop-opacity="0.9" />
            </linearGradient>

            {/* Mountain & Ground Gradient */}
            <linearGradient id="hwRockGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#141a26" />
              <stop offset="40%" stop-color="#0a0e17" />
              <stop offset="100%" stop-color="#030508" />
            </linearGradient>

            {/* Soft Fog Blur Filter */}
            <filter id="hwFogBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="35" />
            </filter>

            <filter id="hwDeepFogBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="60" />
            </filter>

            <filter id="hwMoonGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="42" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Sky */}
          <rect width="1080" height="1920" fill="url(#hwSkyGrad)" />

          {/* Stars */}
          <g fill="#ffffff">
            <circle cx="120" cy="180" r="1.5" opacity="0.6" />
            <circle cx="280" cy="120" r="2" opacity="0.8" />
            <circle cx="390" cy="220" r="1.2" opacity="0.5" />
            <circle cx="680" cy="140" r="1.8" opacity="0.7" />
            <circle cx="820" cy="190" r="1.4" opacity="0.6" />
            <circle cx="940" cy="110" r="2.2" opacity="0.85" />
            <circle cx="180" cy="340" r="1" opacity="0.4" />
            <circle cx="340" cy="280" r="1.6" opacity="0.6" />
            <circle cx="740" cy="310" r="1.3" opacity="0.5" />
            <circle cx="890" cy="260" r="1.7" opacity="0.7" />
            <circle cx="480" cy="150" r="1.5" opacity="0.6" />
            <circle cx="600" cy="110" r="2" opacity="0.75" />
            <circle cx="230" cy="460" r="1.2" opacity="0.4" />
            <circle cx="850" cy="420" r="1.5" opacity="0.5" />
            <circle cx="140" cy="620" r="1" opacity="0.3" />
            <circle cx="970" cy="580" r="1.4" opacity="0.5" />
            <circle cx="310" cy="680" r="1.2" opacity="0.35" />
            <circle cx="780" cy="650" r="1.1" opacity="0.4" />
          </g>

          {/* 2. Giant Luminous Full Moon */}
          <circle cx="510" cy="440" r="390" fill="url(#hwMoonAura)" filter="url(#hwDeepFogBlur)" opacity="0.9" />
          <circle cx="510" cy="440" r="250" fill="url(#hwMoonAura)" opacity="0.95" />

          {/* Moon Disc with Glow */}
          <g filter="url(#hwMoonGlowFilter)">
            <circle cx="510" cy="440" r="162" fill="url(#hwMoonDisc)" />
          </g>

          {/* Realistic Lunar Surface Maria */}
          <g fill="#93a8c0" opacity="0.45">
            <path d="M430,360 Q450,330 490,340 Q530,350 540,380 Q520,410 470,410 Q420,400 430,360 Z" />
            <path d="M480,410 Q510,390 550,400 Q580,420 570,460 Q540,490 500,480 Q460,460 480,410 Z" />
            <path d="M540,370 Q570,350 600,370 Q620,400 590,430 Q560,420 540,370 Z" />
            <path d="M550,440 Q590,430 620,460 Q610,500 570,510 Q530,480 550,440 Z" />
            <path d="M440,440 Q470,450 470,490 Q440,520 410,490 Q410,450 440,440 Z" />
            <circle cx="480" cy="530" r="22" opacity="0.35" />
            <circle cx="580" cy="350" r="18" opacity="0.35" />
            <circle cx="420" cy="420" r="15" opacity="0.3" />
            <circle cx="530" cy="540" r="28" opacity="0.25" />
          </g>

          {/* Distant Misty Pine Ridges */}
          <path d="M0,1150 Q280,1080 540,1180 Q820,1090 1080,1140 L1080,1400 L0,1400 Z" fill="#0d1b2e" opacity="0.6" />
          <path d="M0,1260 Q320,1200 640,1290 Q880,1220 1080,1270 L1080,1500 L0,1500 Z" fill="#091424" opacity="0.8" />

          {/* 3. Red & Crimson Horizon Fog Band */}
          <rect x="0" y="1180" width="1080" height="480" fill="url(#hwCrimsonMistCenter)" filter="url(#hwDeepFogBlur)" />
          <rect x="0" y="1250" width="1080" height="380" fill="url(#hwMistHorizon)" />
          
          <ellipse cx="540" cy="1430" rx="520" ry="110" fill="#ff4d6d" opacity="0.35" filter="url(#hwFogBlur)" />
          <ellipse cx="460" cy="1400" rx="380" ry="70" fill="#ff758c" opacity="0.45" filter="url(#hwFogBlur)" />
          <ellipse cx="620" cy="1450" rx="420" ry="85" fill="#f72585" opacity="0.3" filter="url(#hwFogBlur)" />
          <ellipse cx="300" cy="1480" rx="300" ry="60" fill="#ff8fa3" opacity="0.4" filter="url(#hwFogBlur)" />
          <ellipse cx="780" cy="1470" rx="320" ry="65" fill="#ff4d6d" opacity="0.35" filter="url(#hwFogBlur)" />

          {/* 4. Towering Pine Trees Silhouettes */}
          <g fill="#04070c">
            {/* Left Flank */}
            <path d="M-40,0 L110,0 L85,1920 L-60,1920 Z" />
            <path d="M110,0 L150,0 L120,1350 L75,1350 Z" opacity="0.9" />

            <path d="M30,120 Q180,90 280,140 Q210,170 140,160 Q80,210 20,230 Z" />
            <path d="M10,210 Q240,160 380,230 Q280,270 180,250 Q110,310 30,330 Z" />
            <path d="M50,330 Q280,260 440,350 Q340,390 220,380 Q140,430 40,450 Z" />
            <path d="M30,460 Q260,390 410,480 Q320,520 200,500 Q120,560 20,590 Z" />
            <path d="M70,580 Q290,520 450,610 Q350,650 240,630 Q150,700 60,720 Z" />
            <path d="M60,710 Q260,660 390,750 Q300,780 200,770 Q120,830 50,860 Z" />
            <path d="M40,840 Q220,800 340,880 Q250,910 160,890 Q90,950 30,970 Z" />
            <path d="M20,960 Q200,920 310,1010 Q220,1040 140,1020 Q70,1090 10,1110 Z" />
            <path d="M10,1090 Q180,1070 280,1160 Q190,1180 120,1170 Q50,1230 0,1260 Z" />

            {/* Midground Left Trunk */}
            <path d="M185,480 L210,480 L195,1450 L170,1450 Z" opacity="0.65" />
            <path d="M180,560 Q260,510 320,550 Q260,580 190,580 Z" opacity="0.65" />
            <path d="M180,680 Q280,630 350,670 Q280,700 190,700 Z" opacity="0.65" />
            <path d="M180,800 Q270,760 330,810 Q260,830 185,830 Z" opacity="0.65" />
            <path d="M180,940 Q270,900 330,950 Q250,970 180,970 Z" opacity="0.65" />

            {/* Right Flank */}
            <path d="M810,0 L870,0 L840,1920 L780,1920 Z" />
            <path d="M960,0 L1020,0 L990,1920 L930,1920 Z" />
            <path d="M1020,0 L1100,0 L1100,1920 L1010,1920 Z" />

            <path d="M850,140 Q710,100 620,160 Q690,190 760,180 Q810,230 870,250 Z" />
            <path d="M840,240 Q670,180 560,260 Q650,290 740,280 Q810,340 860,360 Z" />
            <path d="M820,360 Q640,300 520,390 Q610,420 720,410 Q790,460 840,490 Z" />
            <path d="M830,480 Q660,420 540,510 Q620,540 710,530 Q780,590 830,620 Z" />
            <path d="M810,610 Q650,560 550,640 Q630,670 710,660 Q770,720 810,750 Z" />
            <path d="M820,740 Q680,700 580,780 Q660,800 730,800 Q780,850 820,880 Z" />
            <path d="M820,870 Q700,840 610,910 Q680,930 740,930 Q780,980 820,1000 Z" />
            <path d="M810,1000 Q710,980 630,1050 Q700,1070 750,1060 Q790,1110 820,1140 Z" />
            <path d="M810,1130 Q720,1110 650,1180 Q710,1200 760,1190 Q800,1240 820,1270 Z" />

            {/* Midground Right Tree */}
            <path d="M720,700 L740,700 L730,1350 L710,1350 Z" opacity="0.5" />
            <path d="M725,750 Q660,720 620,750 Q660,770 725,770 Z" opacity="0.5" />
            <path d="M725,860 Q650,830 600,870 Q650,890 725,890 Z" opacity="0.5" />
            <path d="M725,990 Q650,960 610,1000 Q660,1020 725,1020 Z" opacity="0.5" />
          </g>

          {/* 5. Massive Foreground Boulder / Rock Outcrop */}
          <g fill="url(#hwRockGrad)">
            <path d="M120,1650 
                     Q180,1570 300,1555 
                     Q450,1545 600,1550 
                     Q750,1560 880,1590 
                     Q960,1615 1010,1670 
                     Q960,1750 920,1830 
                     Q850,1920 700,1920 
                     L160,1920 
                     Q90,1840 90,1740 
                     Q90,1680 120,1650 Z" />
            <path d="M240,1600 Q360,1640 480,1620 Q640,1650 820,1640" stroke="#05080f" strokeWidth="4" fill="none" opacity="0.8" />
            <path d="M170,1670 Q320,1720 540,1700 Q780,1740 940,1710" stroke="#04060c" strokeWidth="6" fill="none" opacity="0.9" />
          </g>

          {/* Red Rim Light on Rock Ridge */}
          <path d="M130,1645 Q240,1565 380,1552 Q550,1545 740,1558 Q880,1588 980,1640" 
                stroke="#ff6584" strokeWidth="3" fill="none" opacity="0.38" filter="url(#hwFogBlur)" />

          {/* 6. The Pack of 5 Howling Wolves */}
          <g fill="#030508" stroke="#030508" strokeLinejoin="round" strokeLinecap="round">
            {/* WOLF 1: Leftmost Wolf */}
            <g>
              <path d="M205,1590 Q195,1555 210,1525 Q220,1505 245,1500 Q275,1498 300,1515 L315,1485 L325,1425 Q332,1398 345,1402 Q348,1405 344,1420 L342,1435 L352,1425 Q358,1430 350,1445 L335,1475 Q330,1505 328,1545 L335,1585 L320,1588 L312,1545 L295,1545 L285,1588 L272,1588 L278,1540 Q250,1545 235,1555 L228,1590 Z" />
              <path d="M210,1525 Q190,1545 195,1575 Q200,1595 198,1605 L208,1595 Q205,1570 215,1540 Z" />
              <path d="M232,1550 L220,1592 L230,1595 L242,1555 Z" />
            </g>

            {/* WOLF 2: Second Wolf */}
            <g>
              <path d="M342,1585 Q355,1540 375,1520 L385,1535 Q365,1560 355,1600 Z" />
              <path d="M365,1580 Q370,1540 390,1510 Q415,1495 445,1490 Q465,1488 480,1460 L485,1415 Q490,1390 500,1392 Q504,1396 498,1415 L492,1428 L505,1418 Q510,1425 500,1440 L485,1468 Q478,1495 475,1530 L482,1575 L468,1577 L465,1530 L448,1530 L440,1577 L425,1577 L430,1525 Q405,1530 390,1545 L382,1582 Z" />
              <path d="M455,1530 L452,1578 L462,1578 L466,1530 Z" />
            </g>

            {/* WOLF 3: Center Wolf */}
            <g>
              <path d="M495,1575 Q500,1535 515,1510 Q535,1495 558,1495 L568,1455 L570,1400 Q575,1380 585,1382 Q588,1386 582,1402 L578,1415 L588,1405 Q592,1412 585,1425 L575,1465 Q572,1495 570,1530 L574,1572 L560,1574 L558,1530 L542,1530 L536,1574 L522,1574 L528,1525 Q510,1530 502,1548 L498,1575 Z" />
              <path d="M502,1520 Q485,1545 488,1575 L498,1570 Q495,1545 510,1525 Z" />
            </g>

            {/* WOLF 4: Alpha Wolf */}
            <g>
              <path d="M580,1575 Q585,1530 605,1490 Q635,1475 675,1470 Q705,1465 725,1430 L732,1370 Q738,1345 750,1348 Q754,1352 748,1372 L742,1388 L756,1375 Q762,1382 752,1400 L735,1438 Q730,1475 728,1520 L736,1575 L718,1578 L715,1520 L695,1520 L686,1578 L668,1578 L675,1515 Q640,1520 620,1540 L610,1577 Z" />
              <path d="M590,1510 Q565,1540 568,1580 L580,1575 Q578,1542 600,1515 Z" />
              <path d="M705,1520 L702,1577 L712,1577 L716,1520 Z" />
            </g>

            {/* WOLF 5: Rightmost Wolf */}
            <g>
              <path d="M775,1595 Q770,1555 788,1528 Q808,1510 835,1505 Q858,1502 872,1472 L878,1425 Q884,1400 894,1404 Q898,1408 892,1425 L886,1438 L898,1428 Q904,1435 895,1450 L880,1480 Q875,1510 872,1545 L876,1595 L862,1597 L860,1545 L845,1545 L838,1597 L824,1597 L828,1540 Q805,1545 795,1562 L790,1595 Z" />
              <path d="M778,1535 Q760,1560 762,1595 Q765,1615 768,1625 L778,1620 Q774,1590 788,1545 Z" />
              <path d="M852,1545 L850,1596 L860,1596 L862,1545 Z" />
            </g>
          </g>

          {/* 7. Ambient Vignette */}
          <radialGradient id="hwVignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stop-color="#000000" stop-opacity="0" />
            <stop offset="100%" stop-color="#010205" stop-opacity="0.65" />
          </radialGradient>
          <rect width="1080" height="1920" fill="url(#hwVignette)" />
        </svg>
      </div>

      {/* 3. Subtle Atmospheric Floating Particles & Ambient Glow for high immersion */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/60 pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
    </div>
  );
};
