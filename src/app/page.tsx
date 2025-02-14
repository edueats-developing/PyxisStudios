import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="min-h-screen bg-[#00A7A2] flex flex-col items-center justify-center text-white px-4">
        <Image
          src="/edueats_logo_white.png"
          alt="EduEats White Logo"
          width={300}
          height={300}
          className="mb-8"
          priority
        />
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">Coming Soon</h1>
        <p className="text-xl md:text-2xl mb-8 text-center">We're cooking up something special!</p>
      </main>

      <footer className="fixed bottom-0 w-full bg-[#008C87] text-white py-4 text-center">
        <p>EduEats.2025 | ABN: 68 998 498 520</p>
      </footer>
    </div>
  )
}
