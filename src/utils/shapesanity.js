// Converts shapesanity names to shape codes

const shapeToCode = {
    "Square": "R",
    "Circle": "C",
    "Star": "S",
    "Windmill": "W"
};

const colorToCode = {
    "Red": "r",
    "Green": "g",
    "Blue": "b",
    "Yellow": "y",
    "Purple": "p",
    "Cyan": "c",
    "White": "w",
    "Uncolored": "u"
};

/**
 * Converts an array of shapesanity names to their corresponding shape codes
 * @param {string[]} shapesanityArray - Array of shapesanity location names
 * @returns {Object} Object mapping shapesanity names to shape codes
 */
export function shapesanityArrayToCodes(shapesanityArray) {
    const result = {};
    
    for (const name of shapesanityArray) {
        const code = shapesanityNameToCode(name);
        result[name] = code;
    }
    
    return result;
}

// Match Regexs
const patterns = {
    // Full single shape (e.g., "Uncolored Circle", "Red Star")
    fullSingle: /^(Uncolored|Red|Green|Blue|Yellow|Purple|Cyan|White)\s+(Circle|Square|Star|Windmill)$/,
    // Half shape (e.g., "Half Purple Circle")
    half: /^Half\s+(Uncolored|Red|Green|Blue|Yellow|Purple|Cyan|White)\s+(Circle|Square|Star|Windmill)$/,
    // Cornered shape (e.g., "Cornered Blue Square")
    cornered: /^Cornered\s+(Uncolored|Red|Green|Blue|Yellow|Purple|Cyan|White)\s+(Circle|Square|Star|Windmill)$/,
    // Cut Out shape (e.g., "Cut Out Red Circle")
    cutOut: /^Cut Out\s+(Uncolored|Red|Green|Blue|Yellow|Purple|Cyan|White)\s+(Circle|Square|Star|Windmill)$/,
    // Single piece (e.g., "White Circle Piece")
    singlePiece: /^(Uncolored|Red|Green|Blue|Yellow|Purple|Cyan|White)\s+(Circle|Square|Star|Windmill)\s+Piece$/,
    // 4 letter color code + shape (e.g., "pruy Star")
    fourLetterColor: /^([rgbypucw]{4})\s+(Circle|Square|Star|Windmill)$/,
    // 3 letter color code + shape with dash (e.g., "cpr- Windmill")
    threeLetterColorDash: /^([rgbypucw]{3})-\s+(Circle|Square|Star|Windmill)$/,
    // Adjacent 2-1 (e.g., "Adjacent 2-1 Ww Ry")
    adjacent21: /^Adjacent 2-1\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Cornered 2-1 (e.g., "Cornered 2-1 Su Sb")
    cornered21: /^Cornered 2-1\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Adjacent Singles (e.g., "Adjacent Singles Cb Wg")
    adjacentSingles: /^Adjacent Singles\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Cornered Singles (e.g., "Cornered Singles Sg Sp")
    corneredSingles: /^Cornered Singles\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // 3-1 (e.g., "3-1 Sw Su")
    threeOne: /^3-1\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Half-Half (e.g., "Half-Half Ry Wu")
    halfHalf: /^Half-Half\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Checkered (e.g., "Checkered Sc Ww")
    checkered: /^Checkered\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Adjacent 2-1-1 (e.g., "Adjacent 2-1-1 Wu Cw Wb")
    adjacent211: /^Adjacent 2-1-1\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Cornered 2-1-1 (e.g., "Cornered 2-1-1 Wp Cy Rw")
    cornered211: /^Cornered 2-1-1\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Singles (4 different quadrants, e.g., "Singles Cc Rp Ry Ww")
    singles: /^Singles\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Singles with 3 pieces (e.g., "Singles Cy Wp Ww")
    singles3: /^Singles\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])\s+([CRWS])([rgbypucw])$/,
    // Color + shape letter combination (e.g., "Uncolored CSW-", "Red CRSW")
    colorShapeLetters: /^(Uncolored|Red|Green|Blue|Yellow|Purple|Cyan|White)\s+([CRWS-]{4})$/
};

/**
 * Converts a single shapesanity name to a shape code
 * @param {string} name - Shapesanity location name (without "Shapesanity " prefix)
 * @returns {string|null} Shape code or null if pattern not recognized
 */
export function shapesanityNameToCode(name) {
    // Remove "Shapesanity " prefix if present
    name = name.replace(/^Shapesanity\s+/, "");
    
    // Full single shape (e.g., "Uncolored Circle", "Red Star")
    const fullShapeMatch = name.match(patterns.fullSingle);
    if (fullShapeMatch) {
        const [, color, shape] = fullShapeMatch;
        const code = shapeToCode[shape] + colorToCode[color];
        return `${code}${code}${code}${code}`;
    }
    
    // Half shape (e.g., "Half Purple Circle")
    const halfMatch = name.match(patterns.half);
    if (halfMatch) {
        const [, color, shape] = halfMatch;
        const code = shapeToCode[shape] + colorToCode[color];
        return `${code}${code}----`;
    }
    
    // Cornered shape (e.g., "Cornered Blue Square")
    const corneredMatch = name.match(patterns.cornered);
    if (corneredMatch) {
        const [, color, shape] = corneredMatch;
        const code = shapeToCode[shape] + colorToCode[color];
        return `${code}--${code}--`;
    }
    
    // Cut Out shape (e.g., "Cut Out Red Circle")
    const cutOutMatch = name.match(patterns.cutOut);
    if (cutOutMatch) {
        const [, color, shape] = cutOutMatch;
        const code = shapeToCode[shape] + colorToCode[color];
        return `${code}${code}${code}--`;
    }
    
    // Single piece (e.g., "White Circle Piece")
    const pieceMatch = name.match(patterns.singlePiece);
    if (pieceMatch) {
        const [, color, shape] = pieceMatch;
        const code = shapeToCode[shape] + colorToCode[color];
        return `${code}------`;
    }
    
    // 4 letter color code + shape (e.g., "pruy Star")
    const fourColorMatch = name.match(patterns.fourLetterColor);
    if (fourColorMatch) {
        const [, colors, shape] = fourColorMatch;
        const shapeCode = shapeToCode[shape];
        return colors.split('').map(c => shapeCode + c).join('');
    }
    
    // 3 letter color code + shape with dash (e.g., "cpr- Windmill")
    const threeColorMatch = name.match(patterns.threeLetterColorDash);
    if (threeColorMatch) {
        const [, colors, shape] = threeColorMatch;
        const shapeCode = shapeToCode[shape];
        return colors.split('').map(c => shapeCode + c).join('') + '--';
    }
    
    // Adjacent 2-1 (e.g., "Adjacent 2-1 Ww Ry")
    const adjacent21Match = name.match(patterns.adjacent21);
    if (adjacent21Match) {
        const [, shape1, color1, shape2, color2] = adjacent21Match;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}${code1}${code2}--`;
    }
    
    // Cornered 2-1 (e.g., "Cornered 2-1 Su Sb")
    const cornered21Match = name.match(patterns.cornered21);
    if (cornered21Match) {
        const [, shape1, color1, shape2, color2] = cornered21Match;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}${code2}${code1}--`;
    }
    
    // Adjacent Singles (e.g., "Adjacent Singles Cb Wg")
    const adjacentSinglesMatch = name.match(patterns.adjacentSingles);
    if (adjacentSinglesMatch) {
        const [, shape1, color1, shape2, color2] = adjacentSinglesMatch;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}${code2}----`;
    }
    
    // Cornered Singles (e.g., "Cornered Singles Sg Sp")
    const corneredSinglesMatch = name.match(patterns.corneredSingles);
    if (corneredSinglesMatch) {
        const [, shape1, color1, shape2, color2] = corneredSinglesMatch;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}--${code2}--`;
    }
    
    // 3-1 (e.g., "3-1 Sw Su")
    const threeOneMatch = name.match(patterns.threeOne);
    if (threeOneMatch) {
        const [, shape1, color1, shape2, color2] = threeOneMatch;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}${code1}${code1}${code2}`;
    }
    
    // Half-Half (e.g., "Half-Half Ry Wu")
    const halfHalfMatch = name.match(patterns.halfHalf);
    if (halfHalfMatch) {
        const [, shape1, color1, shape2, color2] = halfHalfMatch;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}${code1}${code2}${code2}`;
    }
    
    // Checkered (e.g., "Checkered Sc Ww")
    const checkeredMatch = name.match(patterns.checkered);
    if (checkeredMatch) {
        const [, shape1, color1, shape2, color2] = checkeredMatch;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        return `${code1}${code2}${code1}${code2}`;
    }
    
    // Adjacent 2-1-1 (e.g., "Adjacent 2-1-1 Wu Cw Wb")
    const adjacent211Match = name.match(patterns.adjacent211);
    if (adjacent211Match) {
        const [, shape1, color1, shape2, color2, shape3, color3] = adjacent211Match;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        const code3 = shape3 + color3;
        return `${code1}${code1}${code2}${code3}`;
    }
    
    // Cornered 2-1-1 (e.g., "Cornered 2-1-1 Wp Cy Rw")
    const cornered211Match = name.match(patterns.cornered211);
    if (cornered211Match) {
        const [, shape1, color1, shape2, color2, shape3, color3] = cornered211Match;
        const code1 = shape1 + color1;
        const code2 = shape2 + color2;
        const code3 = shape3 + color3;
        return `${code1}${code2}${code1}${code3}`;
    }
    
    // Singles (4 different quadrants, e.g., "Singles Cc Rp Ry Ww")
    const singlesMatch = name.match(patterns.singles);
    if (singlesMatch) {
        const [, s1, c1, s2, c2, s3, c3, s4, c4] = singlesMatch;
        return `${s1}${c1}${s2}${c2}${s3}${c3}${s4}${c4}`;
    }
    
    // Singles with 3 pieces (e.g., "Singles Cy Wp Ww")
    const singles3Match = name.match(patterns.singles3);
    if (singles3Match) {
        const [, s1, c1, s2, c2, s3, c3] = singles3Match;
        return `${s1}${c1}${s2}${c2}${s3}${c3}--`;
    }
    
    // Color + shape letter combination (e.g., "Uncolored CSW-", "Red CRSW")
    const colorShapeLetterMatch = name.match(patterns.colorShapeLetters);
    if (colorShapeLetterMatch) {
        const [, color, shapeLetters] = colorShapeLetterMatch;
        const colorCode = colorToCode[color];
        let result = '';
        for (const shapeLetter of shapeLetters) {
            if (shapeLetter === '-') {
                result += '--';
            } else {
                result += shapeLetter + colorCode;
            }
        }
        return result;
    }
    
    return false;
}
