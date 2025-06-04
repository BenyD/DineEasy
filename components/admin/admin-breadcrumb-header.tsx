import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbComponentItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface AdminBreadcrumbHeaderProps {
  items: { label: string; href?: string }[]
}

export function AdminBreadcrumbHeader({ items }: AdminBreadcrumbHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbComponentItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbComponentItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
