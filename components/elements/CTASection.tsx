import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CTASectionProps {
  title: string
  subtitle: string
  buttonText?: string
  buttonHref?: string
}

export function CTASection({
  title,
  subtitle,
  buttonText = "Start Free Trial",
  buttonHref = "/signup",
}: CTASectionProps) {
  return (
    <section className="py-20">
      <div className="container">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
          <div className="grid gap-6 p-8 md:grid-cols-2 md:p-12">
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl">{title}</h2>
              <p className="text-green-50">{subtitle}</p>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 md:items-end">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50" asChild>
                <a href={buttonHref}>
                  {buttonText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <p className="text-sm text-green-50">Cancel anytime. No hidden fees.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
