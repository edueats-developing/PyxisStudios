'use client'

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">About Us</h1>
      
      <div className="space-y-8">
        <section>
          <p className="text-lg leading-relaxed">
            Welcome to Edu Eats—a platform designed to bring safe, accessible, and convenient food options directly to students and teachers within schools worldwide. Our mission is to transform lunchtime by connecting local restaurants to school communities, ensuring nutritious, allergy-aware meals are available with just a few clicks.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Our Purpose</h2>
          <p className="text-lg leading-relaxed">
            Edu Eats was born from a desire to enhance school food offerings by creating an app similar to services like DoorDash and UberEats but designed specifically for educational environments. We're here to provide students and teachers with an easy, reliable way to pre-order food for delivery at lunchtime.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
          <p className="text-lg leading-relaxed">
            Edu Eats operates as a secure web app accessible only through a school's website link. Users sign in through their school account, ensuring a private and protected experience. Once logged in, students, teachers, and parents can explore a range of approved meal options that meet each school's dietary and allergy guidelines.
          </p>
          <p className="text-lg leading-relaxed mt-4">
            Orders can be placed as early as the day before, with a cutoff at 10 AM on the day of delivery. Meals are then delivered to the school at lunchtime, ready for pickup. With integrated order histories, students' order records are visible to parents and school administrators, providing full transparency and easy meal tracking.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Safety and Quality</h2>
          <p className="text-lg leading-relaxed">
            At Edu Eats, safety is paramount. Every product listed in the app follows strict school dietary rules, and we carefully control for common allergens like nuts and dairy. Additionally, only restaurants open during our designated order window are available, ensuring freshness and timely delivery.
          </p>
        </section>

        <section className="text-center">
          <p className="text-xl font-semibold text-green-600 mt-8">
            Join us in transforming the school lunch experience!
          </p>
        </section>
      </div>
    </div>
  );
}
