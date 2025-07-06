import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface CTASectionProps {
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  features?: string[];
}

export function CTASection({
  title,
  subtitle,
  buttonText = "Start Free Trial",
  buttonHref = "/signup",
  secondaryButtonText = "See Pricing",
  secondaryButtonHref = "/pricing",
  features = [
    "No credit card required",
    "14-day free trial",
    "Cancel anytime",
    "24/7 support",
  ],
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-y-0 w-full bg-white/95">
          <div className="absolute left-1/4 top-0 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-green-200 to-green-50 opacity-30 blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-gradient-to-tr from-green-200 to-green-50 opacity-30 blur-3xl" />
        </div>
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 to-green-800 shadow-2xl"
        >
          <div className="relative px-6 py-10 text-center sm:px-8 md:px-12 md:py-12">
            {/* Decorative Elements */}
            <div className="absolute right-0 top-0 -mt-16 -mr-16 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-green-600/30 to-transparent blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-green-600/30 to-transparent blur-3xl" />

            {/* Content */}
            <div className="relative mx-auto max-w-3xl">
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
              >
                {title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-4 text-base text-green-100 sm:text-lg"
              >
                {subtitle}
              </motion.p>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-6 flex flex-col items-center gap-3 text-sm text-green-100 sm:flex-row sm:justify-center"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-green-300 bg-green-700/30"
                      />
                    ))}
                  </div>
                  <span>1000+ restaurants</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span>⭐️ 4.9/5 rating</span>
                <span className="hidden sm:inline">•</span>
                <span>Swiss Made 🇨🇭</span>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
              >
                <Button
                  size="lg"
                  className="group relative w-full overflow-hidden rounded-xl bg-white px-8 py-6 text-lg font-semibold text-green-700 transition-all hover:bg-green-50 hover:shadow-lg sm:w-auto"
                  asChild
                >
                  <a
                    href={buttonHref}
                    className="flex items-center justify-center gap-2"
                  >
                    {buttonText}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="group relative w-full overflow-hidden rounded-xl border-2 border-white bg-transparent px-8 py-6 text-lg font-semibold text-white transition-all hover:bg-white hover:text-green-700 sm:w-auto"
                  asChild
                >
                  <a
                    href={secondaryButtonHref}
                    className="flex items-center justify-center gap-2"
                  >
                    {secondaryButtonText}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </motion.div>

              {/* Features List */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-green-500/30 pt-6"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    className="flex items-center gap-2 text-green-100"
                  >
                    <Check className="h-5 w-5 text-green-200" />
                    <span className="text-sm">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
