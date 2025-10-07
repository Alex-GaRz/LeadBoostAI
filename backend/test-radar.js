// backend/test-radar.js
const { executeRadarScan } = require('./core/Orchestrator');
const { searchTwitterSignals } = require('./RadarService'); // Importamos también la función directa

async function runFinalTest() {
	console.log('--- Ejecutando prueba final con una búsqueda amplia ---');
	// Usaremos la función directa para probar que el sensor funciona con algo popular
	const testQuery = '#tesla -is:retweet lang:en';
	const signals = await searchTwitterSignals(testQuery);

	console.log('--- RESULTADO DE LA PRUEBA AMPLIA ---');
	console.log(signals);
	console.log(`Se encontraron ${signals.length} tuits sobre Tesla.`);
	console.log('------------------------------------');
}

runFinalTest();
