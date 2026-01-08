dashboard "cost_overview" {
  title = "Multi-Cloud Cost Overview"

  container {
    text {
      value = "## Multi-Cloud Cost Overview"
    }
  }
  
  container {
    card {
      query = query.aws_monthly_cost
      width = 4
      type  = "info"
    }
    card {
      query = query.azure_monthly_cost
      width = 4
      type  = "info"
    }
    card {
      query = query.gcp_monthly_cost
      width = 4
      type  = "info"
    }
  }
}

query "aws_monthly_cost" {
  sql = <<-EOQ
    select
      'AWS Estimated Cost' as label,
      sum(unblended_cost_amount)::numeric::money as value
    from
      aws_cost_by_service_monthly
    where
      period_start >= date_trunc('month', current_date)
  EOQ
}

query "azure_monthly_cost" {
  sql = <<-EOQ
    select
      'Azure Estimated Cost' as label,
      sum(pretax_cost)::numeric::money as value
    from
      azure_cost_management_query
    where
      time_period_from >= date_trunc('month', current_date)
      and timeframe = 'MonthToDate'
      and type = 'ActualCost'
  EOQ
}

query "gcp_monthly_cost" {
  sql = <<-EOQ
    select
      'GCP Estimated Cost' as label,
      sum(cost)::numeric::money as value
    from
      gcp_billing_budget
    -- Note: GCP billing requires significant setup; this is a placeholder Query.
    -- Real implementation would use gcp_billing_account_service_cost or similar
    -- which requires BigQuery export setup usually.
    -- Using a dummy query for initial structure if table doesn't exist or is complex.
  EOQ
}
