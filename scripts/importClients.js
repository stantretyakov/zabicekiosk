const admin = require('firebase-admin');

// Initialize Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS env var is set
// to the path of the service account key JSON file before running this script.
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

// Client data: parentName, childName, and contact info (telegram, phone, or instagram)
const clients = [
  { parentName: 'Анна', childName: 'София', telegram: '@Ania_Gavrilova' },
  { parentName: 'Дарина', childName: 'Ульяна', telegram: '@dvarshukova' },
  { parentName: 'Мария', childName: 'Диана', telegram: '@marikikina' },
  { parentName: 'Алия', childName: 'Роберт', telegram: '@aliya_khanova' },
  { parentName: 'Елена', childName: 'Миа', phone: '+7 999 868 9111' },
  { parentName: 'Анастасия', childName: 'Лев', telegram: '@aburcewa' },
  { parentName: 'Анастасия', childName: 'Ева', telegram: '@SunshineLiar' },
  { parentName: 'Мария', childName: 'Сава', telegram: '@lisavsady' },
  { parentName: 'Ирина', childName: 'Алеша', telegram: '@IrinaSerdtseva' },
  { parentName: 'Елена', childName: 'Вика', telegram: '@chepushtan' },
  { parentName: 'Ирина', childName: 'Лука', telegram: '@IrinaGr1' },
  { parentName: 'Полина', childName: 'Никита', phone: '+7 906 757 5816' },
  { parentName: 'Аида', childName: 'Вера', telegram: '@aida_l_g' },
  { parentName: 'Валерия', childName: 'Виктор', telegram: '@valeriaaleksan' },
  { parentName: 'Елизавета', childName: 'Ева', telegram: '@Elizavetasab' },
  { parentName: 'Наталия', childName: 'Анна', telegram: '@nat_ia' },
  { parentName: 'Катерина', childName: 'Мирослав', telegram: '@justcallmekisa' },
  { parentName: 'Виктория', childName: 'Иван', telegram: '@viktoria_auburn' },
  { parentName: 'Елена', childName: 'Зоя', telegram: '@ellerass' },
  { parentName: 'Ольга', childName: 'Николай' },
  { parentName: 'Полина', childName: 'Женя', telegram: '@Polina_Zotovaa' },
  { parentName: 'Александра', childName: 'Алиса', telegram: '@zhlemur' },
  { parentName: 'Лина', childName: 'Алтай', telegram: '@Malinka_0986' },
  { parentName: 'Александра', childName: 'Стефан', telegram: '@Alexandra0sasha' },
  { parentName: 'Александра', childName: 'Леня', telegram: '@akarhanina' },
  { parentName: 'Любовь', childName: 'Артем', phone: '+381 69 340 6311' },
  { parentName: 'Йована', childName: 'Огнен', phone: '+381 60 311 9128' },
  { parentName: 'Dijana', childName: 'Srna', instagram: 'https://www.instagram.com/dijana_aradinovic?igsh=MXcyZG5weDJ5ZnVweQ==' },
];

async function importClients() {
  const batch = db.batch();

  clients.forEach((client) => {
    const docRef = db.collection('clients').doc(); // auto-generated ID
    batch.set(docRef, client);
  });

  await batch.commit();
  console.log(`Imported ${clients.length} clients`);
}

importClients().catch((err) => {
  console.error('Error importing clients', err);
  process.exit(1);
});
