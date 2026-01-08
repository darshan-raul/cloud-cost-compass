dashboard "aws_cost_detail" {
  title = "AWS Cost Detail"

  container {
    card {
      query = query.aws_monthly_cost
      width = 6
    }
  }

  container {
    table {
      query = query.aws_cost_by_service
    }
  }
}

query "aws_cost_by_service" {
  sql = <<-EOQ
    select
      service as "Service",
      sum(unblended_cost_amount)::numeric::money as "Cost"
    from
      aws_cost_by_service_monthly
    where
      period_start >= date_trunc('month', current_date)
    group by
      service
    order by
      sum(unblended_cost_amount) desc
  EOQ
}
