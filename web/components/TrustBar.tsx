export default function TrustBar() {
    const brands = ["PyTorch", "TensorFlow", "OpenAI", "NextJS", "Vercel"];

    return (
        <div className="w-full py-10 border-y border-white/5 bg-[#0A121F]/50 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-12 lg:gap-24 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                {brands.map((brand) => (
                    <span key={brand} className="text-xl lg:text-2xl font-display font-bold text-white tracking-wider cursor-default">
                        {brand}
                    </span>
                ))}
            </div>
        </div>
    );
}
