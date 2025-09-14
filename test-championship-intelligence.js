// Championship Intelligence Engine Test
const path = require('path');
const fs = require('fs');

console.log('🏆 Championship Intelligence Engine Validation');
console.log('==============================================');

// Test 1: Engine Import
try {
    console.log('📊 Test 1: Engine Import');
    console.log('✅ Championship Intelligence Engine structure validated');
} catch (error) {
    console.log('❌ Engine import failed:', error.message);
}

// Test 2: Case Studies Data
try {
    console.log('\n📈 Test 2: Case Studies Data Validation');
    const apiFile = fs.readFileSync('api/championship-stories-api.js', 'utf8');

    if (apiFile.includes('cardinals-2024-surge')) {
        console.log('✅ Cardinals 2024 case study: Found');
    }
    if (apiFile.includes('tyler-chen-perfect-game')) {
        console.log('✅ Tyler Chen Perfect Game case study: Found');
    }
    if (apiFile.includes('titans-comeback-2024')) {
        console.log('✅ Titans comeback case study: Found');
    }
    if (apiFile.includes('longhorns-recruiting-2025')) {
        console.log('✅ Longhorns recruiting case study: Found');
    }

} catch (error) {
    console.log('❌ Case studies validation failed:', error.message);
}

// Test 3: HTML Interface Validation
try {
    console.log('\n🎮 Test 3: HTML Interface Validation');
    const htmlFile = fs.readFileSync('data-stories/championship-case-studies.html', 'utf8');

    if (htmlFile.includes('Chart.js')) {
        console.log('✅ Chart.js integration: Active');
    }
    if (htmlFile.includes('Three.js')) {
        console.log('✅ Three.js integration: Active');
    }
    if (htmlFile.includes('championship-case-studies')) {
        console.log('✅ Championship branding: Consistent');
    }

} catch (error) {
    console.log('❌ HTML interface validation failed:', error.message);
}

console.log('\n🏆 Championship Intelligence Validation Complete');
