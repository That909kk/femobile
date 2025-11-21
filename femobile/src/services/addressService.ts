import { httpClient } from './httpClient';

export interface Province {
  code: string;
  name: string;
  englishName: string;
  administrativeLevel: string;
  decree: string;
}

export interface Commune {
  code: string;
  name: string;
  englishName: string;
  administrativeLevel: string;
  provinceCode: string;
  provinceName: string;
  decree: string;
}

class AddressService {
  /**
   * Lấy danh sách tất cả phường/xã từ API backend
   */
  async getVietnamAddresses(): Promise<Commune[]> {
    try {
      const response = await httpClient.get<Commune[]>('/addresses/vietnam');
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Không thể tải danh sách địa chỉ');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching Vietnam addresses:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách phường/xã theo tỉnh từ API backend
   */
  async getCommunesByProvince(provinceId: string, effectiveDate?: string): Promise<Commune[]> {
    try {
      const date = effectiveDate || new Date().toISOString().split('T')[0];
      const response = await httpClient.get<Commune[]>(
        `/addresses/${date}/provinces/${provinceId}/communes`,
      );
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Không thể tải danh sách phường/xã');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching communes by province:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách tỉnh/thành phố từ API backend
   */
  async getProvinces(effectiveDate?: string): Promise<Province[]> {
    try {
      const date = effectiveDate || new Date().toISOString().split('T')[0];
      const response = await httpClient.get<Province[]>(`/addresses/${date}/provinces`);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Không thể tải danh sách tỉnh/thành phố');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching provinces from backend:', error);
      throw error;
    }
  }

  /**
   * Tìm kiếm tỉnh/thành phố theo tên
   */
  searchProvinces(provinces: Province[], searchTerm: string): Province[] {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return provinces;
    
    return provinces.filter(province => 
      province.name.toLowerCase().includes(term) ||
      province.englishName.toLowerCase().includes(term)
    );
  }

  /**
   * Tìm kiếm phường/xã theo tên
   */
  searchCommunes(communes: Commune[], searchTerm: string): Commune[] {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return communes;
    
    return communes.filter(commune => 
      commune.name.toLowerCase().includes(term) ||
      commune.englishName.toLowerCase().includes(term)
    );
  }
}

export const addressService = new AddressService();
