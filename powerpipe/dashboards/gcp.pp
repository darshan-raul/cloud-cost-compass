dashboard "gcp_cost_detail" {
  title = "GCP Cost Detail"

  text {
    value = "Note: GCP Billing usually requires BigQuery export to be enabled and configured."
  }

  container {
    card {
      query = query.gcp_monthly_cost
      width = 6
    }
  }
}
