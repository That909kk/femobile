import axios from 'axios';

const ADDRESS_API_BASE = process.env.EXPO_ADDRESS_KIT_API || 'https://production.cas.so/address-kit/2025-07-01';

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

export interface ProvincesResponse {
  requestId: string;
  provinces: Province[];
}

export interface CommunesResponse {
  requestId: string;
  communes: Commune[];
}

class AddressService {
  /**
   * Lấy danh sách tất cả tỉnh/thành phố
   */
  async getProvinces(): Promise<Province[]> {
    try {
      const response = await axios.get<ProvincesResponse>(`${ADDRESS_API_BASE}/provinces`);
      return response.data.provinces;
    } catch (error) {
      console.error('Error fetching provinces:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách phường/xã theo mã tỉnh/thành phố
   */
  async getCommunes(provinceCode: string): Promise<Commune[]> {
    try {
      const response = await axios.get<CommunesResponse>(
        `${ADDRESS_API_BASE}/provinces/${provinceCode}/communes`
      );
      return response.data.communes;
    } catch (error) {
      console.error('Error fetching communes:', error);
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
