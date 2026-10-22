import { useAuth } from "../hooks/useAuth";

const DAY = [
  ["6:30 AM", "Warm water, 5 soaked almonds, 2 walnut halves"],
  ["8:00 AM", "3 idli or 2 ragi dosa with sambar, plus 3 boiled eggs (or 100 g paneer bhurji)"],
  ["11:00 AM", "Guava or orange, 1 amla, green tea"],
  ["1:30 PM", "1 cup rice or 2 chapati, 150 g chicken or fish curry (or rajma/chana + curd), big serving of poriyal or keerai, 1 cup curd"],
  ["4:30 PM", "1 cup sundal or 1 scoop whey in water"],
  ["7:30 PM", "2 chapati or millet dosa, 150 g grilled chicken, fish, egg whites or soya, vegetable kootu"],
  ["9:30 PM", "Optional: 1 glass toned milk with a pinch of turmeric"],
];

const SKIN = [
  ["Vitamin C", "Builds collagen, clears dullness", "Amla, guava, orange, papaya, capsicum"],
  ["Omega-3", "Keeps skin supple, less dryness", "Mackerel (ayala), sardine (mathi), walnuts, flaxseed"],
  ["Vitamin E", "Protects from sun damage", "Almonds, sunflower seeds, groundnuts"],
  ["Beta-carotene", "Even, healthy tone", "Carrot, sweet potato, pumpkin, mango"],
  ["Lycopene", "Sun protection from within", "Cooked tomato, watermelon, guava"],
  ["Zinc", "Controls acne and oil", "Pumpkin seeds, chickpeas, eggs, cashews"],
];

const HAIR = [
  ["Protein", "Hair is made of keratin", "Eggs, chicken, fish, paneer, dal, soya"],
  ["Iron", "Low iron is a top cause of hair fall", "Murungai keerai, spinach, rajma, chicken liver"],
  ["Biotin", "Supports keratin production", "Egg yolk, almonds, sweet potato"],
  ["Vitamin D", "Helps new follicles", "15–20 min morning sun, egg yolk, fatty fish"],
];

function FoodTable({ rows }) {
  return (
    <div className="food-table">
      {rows.map(([n, why, foods]) => (
        <div key={n} className="food-row">
          <b>{n}</b><span className="muted">{why}</span><span>{foods}</span>
        </div>
      ))}
    </div>
  );
}

export default function Plan() {
  const { goals } = useAuth().userData;
  return (
    <div className="page">
      <header className="page-head"><h1>My plan</h1></header>

      <div className="targets">
        <div><b>{goals.calories.toLocaleString("en-IN")}</b><span>kcal</span></div>
        <div><b>{goals.protein} g</b><span>protein</span></div>
        <div><b>{goals.carbs} g</b><span>carbs</span></div>
        <div><b>{goals.fat} g</b><span>fat</span></div>
        <div><b>{(goals.waterMl / 1000).toFixed(1)} L</b><span>water</span></div>
      </div>

      <div className="plan-grid">
        <section className="card">
          <h2>A sample day</h2>
          <ol className="timeline">
            {DAY.map(([t, m]) => <li key={t}><time>{t}</time><span>{m}</span></li>)}
          </ol>
        </section>

        <div className="stack">
          <section className="card">
            <h2>Foods for glowing skin</h2>
            <FoodTable rows={SKIN} />
            <p className="note">
              Food can't change your natural skin colour, which is genetic. It can clear dullness and tanning damage.
              Daily SPF 30+ sunscreen and 7–8 hours of sleep do the most for a bright, young-looking face.
            </p>
          </section>
          <section className="card">
            <h2>Foods for hair growth</h2>
            <FoodTable rows={HAIR} />
            <p className="muted small">Have amla, lemon or guava with iron-rich meals to absorb more iron.</p>
          </section>
          <section className="card">
            <h2>Cut back on</h2>
            <p>Sweets, bakery items, fried snacks, soft drinks, parotta and maida, and large plates of white rice at night.</p>
          </section>
        </div>
      </div>
      <p className="muted small disclaimer">General guidance, not medical advice. For heavy hair fall, a simple blood test (iron, vitamin D, B12, thyroid) usually finds the cause.</p>
    </div>
  );
}
