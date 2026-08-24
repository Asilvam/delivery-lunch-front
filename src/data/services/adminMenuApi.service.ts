import axios from "axios";
import type {
  AdminMenu,
  AdminMenuInput,
  AdminMenuUpdateInput,
} from "../../types/adminMenu";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const authConfig = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
  timeout: 15000,
});

export async function fetchAdminMenus(
  token: string,
  from: string,
  to: string,
): Promise<AdminMenu[]> {
  const response = await axios.get<AdminMenu[]>(`${BASE_URL}/menu/admin/list`, {
    ...authConfig(token),
    params: { from, to },
  });
  return response.data;
}

export async function createAdminMenu(
  token: string,
  input: AdminMenuInput,
): Promise<AdminMenu> {
  const response = await axios.post<AdminMenu>(
    `${BASE_URL}/menu`,
    input,
    authConfig(token),
  );
  return response.data;
}

export async function updateAdminMenu(
  token: string,
  id: string,
  input: AdminMenuUpdateInput,
): Promise<AdminMenu> {
  const response = await axios.patch<AdminMenu>(
    `${BASE_URL}/menu/${id}`,
    input,
    authConfig(token),
  );
  return response.data;
}

export async function copyAdminMenu(
  token: string,
  id: string,
  fecha: string,
): Promise<AdminMenu> {
  const response = await axios.post<AdminMenu>(
    `${BASE_URL}/menu/${id}/copy`,
    {},
    { ...authConfig(token), params: { fecha } },
  );
  return response.data;
}

export async function publishAdminMenu(
  token: string,
  id: string,
): Promise<AdminMenu> {
  const response = await axios.patch<AdminMenu>(
    `${BASE_URL}/menu/${id}/publish`,
    {},
    authConfig(token),
  );
  return response.data;
}

export async function archiveAdminMenu(
  token: string,
  id: string,
): Promise<AdminMenu> {
  const response = await axios.patch<AdminMenu>(
    `${BASE_URL}/menu/${id}/archive`,
    {},
    authConfig(token),
  );
  return response.data;
}

export async function deleteAdminMenu(
  token: string,
  id: string,
): Promise<void> {
  await axios.delete(`${BASE_URL}/menu/${id}`, authConfig(token));
}

export async function uploadAdminMenuImage(
  token: string,
  file: File,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post<{ url: string }>(
    `${BASE_URL}/upload/image`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    },
  );
  return response.data.url;
}
