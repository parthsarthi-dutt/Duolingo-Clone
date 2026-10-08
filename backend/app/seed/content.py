"""Authoring data for the seeded Spanish course.

Only vocabulary and sentences are written by hand. The exercises themselves
(multiple choice, word bank, match pairs, fill-in-the-blank, typed answers)
are generated from this data by `builder.py`.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Word:
    es: str
    en: str
    image: str | None = None  # illustration key under frontend/public/images/vocab


@dataclass(frozen=True)
class Sentence:
    es: str
    en: str
    blank: str  # the Spanish word hidden in fill-in-the-blank exercises
    alt_en: tuple[str, ...] = ()  # other accepted English translations
    alt_es: tuple[str, ...] = ()  # other accepted Spanish translations


@dataclass(frozen=True)
class SkillSpec:
    title: str
    icon: str = "star"
    kind: str = "lesson"  # "lesson" | "chest" | "review"
    words: tuple[Word, ...] = ()
    sentences: tuple[Sentence, ...] = ()
    reward_gems: int = 0


@dataclass(frozen=True)
class UnitSpec:
    title: str
    description: str
    color: str
    skills: tuple[SkillSpec, ...]


W, S = Word, Sentence
CHEST = SkillSpec(title="Treasure chest", icon="chest", kind="chest", reward_gems=20)
REVIEW = SkillSpec(title="Unit review", icon="trophy", kind="review")

COURSE_TITLE = "Spanish"

UNITS: tuple[UnitSpec, ...] = (
    UnitSpec(
        title="Order at a café",
        description="Order food and drinks, and be polite about it",
        color="green",
        skills=(
            SkillSpec(
                title="Order drinks",
                words=(
                    W("café", "coffee", "coffee"),
                    W("té", "tea", "tea"),
                    W("taco", "taco", "taco"),
                    W("agua", "water", "water"),
                    W("leche", "milk", "milk"),
                ),
                sentences=(
                    S("Un café, por favor.", "A coffee, please.", "café",
                      alt_en=("One coffee, please.", "Coffee, please.")),
                    S("Un té.", "A tea.", "té", alt_en=("One tea.",)),
                    S("Un taco y un café.", "A taco and a coffee.", "taco",
                      alt_en=("One taco and one coffee.",)),
                    S("Agua, por favor.", "Water, please.", "favor"),
                ),
            ),
            SkillSpec(
                title="Order food",
                words=(
                    W("pan", "bread", "bread"),
                    W("manzana", "apple", "apple"),
                    W("queso", "cheese", "cheese"),
                    W("pizza", "pizza", "pizza"),
                    W("huevo", "egg", "egg"),
                ),
                sentences=(
                    S("Yo como pan.", "I eat bread.", "pan", alt_es=("Como pan.",)),
                    S("Una manzana, por favor.", "An apple, please.", "manzana",
                      alt_en=("One apple, please.",)),
                    S("Pan y queso.", "Bread and cheese.", "queso"),
                    S("Yo quiero pizza.", "I want pizza.", "pizza", alt_es=("Quiero pizza.",)),
                ),
            ),
            SkillSpec(
                title="Be polite",
                icon="book",
                words=(
                    W("gracias", "thank you"),
                    W("por favor", "please"),
                    W("sí", "yes"),
                    W("de nada", "you're welcome"),
                    W("perdón", "sorry"),
                ),
                sentences=(
                    S("Sí, por favor.", "Yes, please.", "favor"),
                    S("No, gracias.", "No, thank you.", "gracias", alt_en=("No, thanks.",)),
                    S("Leche, por favor.", "Milk, please.", "por"),
                    S("Perdón, un café.", "Sorry, a coffee.", "café",
                      alt_en=("Excuse me, a coffee.", "Sorry, one coffee.")),
                ),
            ),
            CHEST,
            SkillSpec(
                title="Pay the check",
                icon="dumbbell",
                words=(
                    W("cuenta", "check"),
                    W("dinero", "money", "money"),
                    W("tarjeta", "card", "card"),
                    W("mesa", "table"),
                    W("menú", "menu"),
                ),
                sentences=(
                    S("La cuenta, por favor.", "The check, please.", "cuenta",
                      alt_en=("The bill, please.",)),
                    S("Una mesa, por favor.", "A table, please.", "mesa",
                      alt_en=("One table, please.",)),
                    S("El menú, por favor.", "The menu, please.", "menú"),
                    S("Yo tengo dinero.", "I have money.", "dinero", alt_es=("Tengo dinero.",)),
                ),
            ),
            REVIEW,
        ),
    ),
    UnitSpec(
        title="Greet people and say goodbye",
        description="Say hello, ask how someone is, and introduce yourself",
        color="purple",
        skills=(
            SkillSpec(
                title="Say hello",
                words=(
                    W("hola", "hello", "wave"),
                    W("adiós", "goodbye"),
                    W("buenos días", "good morning", "sunrise"),
                    W("buenas tardes", "good afternoon", "sun"),
                    W("buenas noches", "good night", "moon"),
                ),
                sentences=(
                    S("Hola, buenos días.", "Hello, good morning.", "días",
                      alt_en=("Hi, good morning.",)),
                    S("Buenas noches, mamá.", "Good night, mom.", "noches"),
                    S("Hola y adiós.", "Hello and goodbye.", "adiós", alt_en=("Hi and bye.",)),
                    S("Buenas tardes, señor.", "Good afternoon, sir.", "tardes"),
                ),
            ),
            SkillSpec(
                title="Ask how someone is",
                words=(
                    W("bien", "well"),
                    W("mal", "bad"),
                    W("muy", "very"),
                    W("cómo", "how"),
                    W("tú", "you"),
                ),
                sentences=(
                    S("¿Cómo estás?", "How are you?", "estás"),
                    S("Muy bien, gracias.", "Very well, thank you.", "bien",
                      alt_en=("Very good, thank you.", "Very well, thanks.")),
                    S("Yo estoy bien.", "I am well.", "estoy",
                      alt_en=("I am fine.", "I'm fine.", "I'm well.", "I am good."),
                      alt_es=("Estoy bien.",)),
                    S("¿Y tú?", "And you?", "tú"),
                ),
            ),
            SkillSpec(
                title="Introduce yourself",
                icon="book",
                words=(
                    W("me llamo", "my name is"),
                    W("mucho gusto", "nice to meet you"),
                    W("soy", "I am"),
                    W("señor", "sir"),
                    W("señora", "ma'am"),
                ),
                sentences=(
                    S("Me llamo Ana.", "My name is Ana.", "llamo"),
                    S("Mucho gusto, señora.", "Nice to meet you, ma'am.", "gusto"),
                    S("Yo soy Luis.", "I am Luis.", "soy",
                      alt_en=("I'm Luis.",), alt_es=("Soy Luis.",)),
                    S("Hola, me llamo Juan.", "Hello, my name is Juan.", "me",
                      alt_en=("Hi, my name is Juan.",)),
                ),
            ),
            CHEST,
            SkillSpec(
                title="Say goodbye",
                icon="dumbbell",
                words=(
                    W("hasta luego", "see you later"),
                    W("hasta mañana", "see you tomorrow"),
                    W("nos vemos", "see you"),
                    W("chao", "bye"),
                    W("amigo", "friend"),
                ),
                sentences=(
                    S("Hasta luego, amigo.", "See you later, friend.", "luego"),
                    S("Hasta mañana, Ana.", "See you tomorrow, Ana.", "mañana"),
                    S("Adiós, nos vemos.", "Goodbye, see you.", "vemos", alt_en=("Bye, see you.",)),
                    S("Chao, amigo.", "Bye, friend.", "amigo", alt_en=("Goodbye, friend.",)),
                ),
            ),
            REVIEW,
        ),
    ),
    UnitSpec(
        title="Say where you are from",
        description="Talk about countries, people, languages and home",
        color="teal",
        skills=(
            SkillSpec(
                title="Countries",
                words=(
                    W("España", "Spain", "spain"),
                    W("México", "Mexico", "mexico"),
                    W("Estados Unidos", "United States", "usa"),
                    W("Inglaterra", "England", "england"),
                    W("país", "country"),
                ),
                sentences=(
                    S("Yo soy de España.", "I am from Spain.", "España",
                      alt_en=("I'm from Spain.",), alt_es=("Soy de España.",)),
                    S("Soy de México.", "I am from Mexico.", "México",
                      alt_en=("I'm from Mexico.",), alt_es=("Yo soy de México.",)),
                    S("¿De dónde eres?", "Where are you from?", "dónde"),
                    S("Ella es de Inglaterra.", "She is from England.", "Inglaterra",
                      alt_en=("She's from England.",)),
                ),
            ),
            SkillSpec(
                title="People",
                words=(
                    W("hombre", "man", "man"),
                    W("mujer", "woman", "woman"),
                    W("niño", "boy", "boy"),
                    W("niña", "girl", "girl"),
                    W("persona", "person"),
                ),
                sentences=(
                    S("Yo soy un hombre.", "I am a man.", "hombre",
                      alt_en=("I'm a man.",), alt_es=("Soy un hombre.",)),
                    S("Ella es una mujer.", "She is a woman.", "mujer",
                      alt_en=("She's a woman.",)),
                    S("Él es un niño.", "He is a boy.", "niño", alt_en=("He's a boy.",)),
                    S("La niña es de México.", "The girl is from Mexico.", "niña"),
                ),
            ),
            SkillSpec(
                title="Languages",
                icon="book",
                words=(
                    W("español", "Spanish"),
                    W("inglés", "English"),
                    W("hablo", "I speak"),
                    W("hablas", "you speak"),
                    W("un poco", "a little"),
                ),
                sentences=(
                    S("Yo hablo español.", "I speak Spanish.", "hablo",
                      alt_es=("Hablo español.",)),
                    S("¿Hablas inglés?", "Do you speak English?", "inglés",
                      alt_en=("You speak English?",)),
                    S("Hablo un poco.", "I speak a little.", "poco", alt_es=("Yo hablo un poco.",)),
                    S("Ella habla inglés.", "She speaks English.", "habla"),
                ),
            ),
            CHEST,
            SkillSpec(
                title="Home",
                icon="dumbbell",
                words=(
                    W("casa", "house", "house"),
                    W("ciudad", "city", "city"),
                    W("escuela", "school", "school"),
                    W("aquí", "here"),
                    W("grande", "big"),
                ),
                sentences=(
                    S("Yo vivo aquí.", "I live here.", "aquí", alt_es=("Vivo aquí.",)),
                    S("Mi casa es grande.", "My house is big.", "casa",
                      alt_en=("My home is big.",)),
                    S("Vivo en la ciudad.", "I live in the city.", "ciudad",
                      alt_es=("Yo vivo en la ciudad.",)),
                    S("La escuela es grande.", "The school is big.", "grande"),
                ),
            ),
            REVIEW,
        ),
    ),
)

# (key, title, description, metric, icon, color, tier thresholds)
ACHIEVEMENTS = (
    ("wildfire", "Wildfire", "Reach a {target} day streak", "streak", "flame", "red",
     (3, 7, 14, 30, 60, 100)),
    ("sage", "Sage", "Earn {target} XP", "total_xp", "bolt", "green",
     (100, 250, 500, 1000, 2500, 5000)),
    ("scholar", "Scholar", "Complete {target} lessons", "lessons", "book", "blue",
     (5, 15, 30, 60, 100)),
    ("sharpshooter", "Sharpshooter", "Finish {target} lessons with no mistakes",
     "perfect_lessons", "target", "purple", (2, 5, 10, 25, 50)),
    ("trailblazer", "Trailblazer", "Complete {target} levels on the path", "skills", "trophy",
     "orange", (2, 5, 10, 12)),
    ("legend", "Legend", "Reach Legendary on {target} levels", "legendary_skills", "crown",
     "gold", (1, 3, 6, 12)),
)

# (key, title, metric, target, reward_gems, icon) -- target None follows the daily XP goal
QUESTS = (
    ("daily_xp", "Earn {target} XP", "xp", None, 10, "bolt"),
    ("lessons", "Complete {target} lessons", "lessons", 2, 10, "book"),
    ("perfect", "Finish a lesson with no mistakes", "perfect_lessons", 1, 15, "target"),
)

# Leaderboard rivals: (display name, avatar colour)
RIVALS = (
    ("Sofía Ramírez", "#CE82FF"),
    ("Liam Chen", "#1CB0F6"),
    ("Aiko Tanaka", "#FF4B4B"),
    ("Noah Williams", "#FF9600"),
    ("Priya Nair", "#58CC02"),
    ("Mateo García", "#CE82FF"),
    ("Emma Schmidt", "#FF86D0"),
    ("Omar Haddad", "#1CB0F6"),
    ("Chloé Martin", "#FF4B4B"),
    ("Lucas Oliveira", "#58CC02"),
    ("Zara Ahmed", "#FF9600"),
    ("Ivan Petrov", "#00CD9C"),
)

LEARNER = {
    "username": "alex_morgan",
    "display_name": "Alex Morgan",
    "avatar_color": "#1CB0F6",
    "gems": 505,
}
