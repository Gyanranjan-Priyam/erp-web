import { ChartAreaInteractive } from "@/components/dashboard-components/faculty/chart-area-interactive"
import { DataTable } from "@/components/dashboard-components/faculty/data-table"
import { SectionCards } from "@/components/dashboard-components/faculty/section-cards"

import data from "./data.json"

export default function TeacherPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  )
}
