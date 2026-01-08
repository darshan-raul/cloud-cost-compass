dashboard "azure_cost_detail" {
  title = "Azure Cost Detail"

  container {
    card {
      query = query.azure_monthly_cost
      width = 6
    }
  }

  container {
    table {
      query = query.azure_cost_by_service
    }
  }
}

query "azure_cost_by_service" {
  sql = <<-EOQ
    select
      service_name as "Service",
      sum(pretax_cost)::numeric::money as "Cost"
    from
      azure_cost_management_query
    where
      time_period_from >= date_trunc('month', current_date)
      and timeframe = 'MonthToDate'
      and type = 'ActualCost'
    group by
      service_name
    order by
      sum(pretax_cost) desc
  EOQ
}
