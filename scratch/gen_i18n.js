const glossary = [
  ["Mental health", "Ubuzima bwo mu mutwe", "Condition"],
  ["Anxiety", "Impungenge", "Condition"],
  ["Depression", "Agahinda gakabije", "Condition"],
  ["Stress", "Umunaniro ukabije", "Condition"],
  ["Trauma", "Ihungabana", "Condition"],
  ["Crisis", "Ikibazo gikabije", "Condition"],
  ["Burnout", "Kunanirwa bikabije", "Condition"],
  ["Panic attack", "Gutinya bikabije", "Condition"],
  ["Self-harm", "Kwigirira nabi", "Condition"],
  ["Suicide", "Kwiyahura", "Condition"],
  ["Wellness", "Kumera neza", "Condition"],
  ["Mind", "Ubwenge", "Condition"],
  ["Grief", "ISHAVU", "Emotion"],
  ["Fear", "Ubwoba", "Emotion"],
  ["Sadness", "Agahinda", "Emotion"],
  ["Anger", "Uburakari", "Emotion"],
  ["Loneliness", "Kwiyumva wenyine", "Emotion"],
  ["Hope", "Ibyiringiro", "Emotion"],
  ["Joy", "Ibyishimo", "Emotion"],
  ["Shame", "Isoni", "Emotion"],
  ["Guilt", "Ibyaha", "Emotion"],
  ["Worry", "Gutinya", "Emotion"],
  ["Mood", "Imyitwarire y'umutima", "Emotion"],
  ["Feelings", "Ibyiyumvo", "Emotion"],
  ["Emotions", "Amarangamutima", "Emotion"],
  ["Therapy", "Ubuvuzi bwo guturisha umutima", "Support"],
  ["Counselling", "Ubujyanama", "Support"],
  ["Support", "ubufasha", "Support"],
  ["Healing", "Gukira", "Support"],
  ["Recovery", "Gusubirana", "Support"],
  ["Breathe", "Humeka", "Action"],
  ["Relax", "Tegereza", "Action"],
  ["Journal", "Andika iby’uyumunsi", "Action"],
  ["Meditate", "itekerezeho", "Action"],
  ["Rest", "Ruhuka", "Action"],
  ["Talk to someone", "Bwira umuntu", "Action"],
  ["Seek help", "Shaka ubufasha", "Action"],
  ["Exercise", "Imyitozo ngororamubiri", "Action"],
  ["Sleep", "Sinzira", "Action"],
  ["Eat well", "Rya neza", "Action"],
  ["How are you feeling?", "Umeze ute?", "App UI"],
  ["You are not alone", "Nturiwenyine", "App UI"],
  ["We are here for you", "Turi hano ngo tugufashe", "App UI"],
  ["Take a deep breath", "Humeka neza", "App UI"],
  ["Log your mood", "Andika uko wiyumva", "App UI"],
  ["Daily check-in", "Kwisuzuma buri munsi", "App UI"],
  ["Emergency help", "Ubufasha bw'ihutirwa", "App UI"],
  ["Settings", "Igenamiterere", "App UI"],
  ["Notifications", "Amamenyesha", "App UI"],
  ["Get started", "Tangira", "App UI"]
];

const en = {};
const rw = {};

glossary.forEach(([eng, kin, cat]) => {
  const key = `glossary.${eng.toLowerCase().replace(/ /g, '_').replace(/\?/g, '')}`;
  en[key] = eng;
  rw[key] = kin;
});

console.log("EN:", JSON.stringify(en, null, 2));
console.log("RW:", JSON.stringify(rw, null, 2));
