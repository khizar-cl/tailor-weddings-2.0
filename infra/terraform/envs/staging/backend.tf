terraform {
  cloud {
    organization = "tailorweddings2"

    workspaces {
      name = "tailorweddings2-staging"
    }
  }
}
