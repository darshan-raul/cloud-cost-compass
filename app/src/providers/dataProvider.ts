import type { DataProvider } from "@refinedev/core";
import { mcpClient, ragClient, alertsClient } from "./api";

function normalizePath(resource: string, id?: string | number) {
  return id === undefined ? `/${resource}` : `/${resource}/${id}`;
}

function adaptClient(client: typeof mcpClient): Pick<DataProvider, "getList" | "getOne" | "create" | "update" | "deleteOne" | "getApiUrl"> {
  return {
    getApiUrl: () => client.defaults.baseURL ?? "",
    getList: async ({ resource, pagination, filters, sorters }) => {
      const params: Record<string, unknown> = {
        page: pagination?.current ?? 1,
        pageSize: pagination?.pageSize ?? 25,
      };
      if (filters && filters.length > 0) params.filters = filters;
      if (sorters && sorters.length > 0) params.sorters = sorters;
      const { data } = await client.get(normalizePath(resource), { params });
      return { data: data.items ?? data.data ?? data, total: data.total ?? (data.data?.length ?? 0) };
    },
    getOne: async ({ resource, id }) => {
      const { data } = await client.get(normalizePath(resource, id));
      return { data: data.item ?? data };
    },
    create: async ({ resource, variables }) => {
      const { data } = await client.post(normalizePath(resource), variables);
      return { data };
    },
    update: async ({ resource, id, variables }) => {
      const { data } = await client.patch(normalizePath(resource, id), variables);
      return { data };
    },
    deleteOne: async ({ resource, id }) => {
      const { data } = await client.delete(normalizePath(resource, id));
      return { data };
    },
  };
}

export const mcpDataProvider: DataProvider = adaptClient(mcpClient) as DataProvider;
export const ragDataProvider: DataProvider = adaptClient(ragClient) as DataProvider;
export const alertsDataProvider: DataProvider = adaptClient(alertsClient) as DataProvider;
