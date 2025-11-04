import { CarProps, FilterProps } from "@types";
import localCars from "@server/data/cars.json";

export const calculateCarRent = (city_mpg: number, year: number) => {
  const basePricePerDay = 50; // Base rental price per day in dollars
  const mileageFactor = 0.1; // Additional rate per mile driven
  const ageFactor = 0.05; // Additional rate per year of vehicle age

  // Calculate additional rate based on mileage and age
  const mileageRate = city_mpg * mileageFactor;
  const ageRate = (new Date().getFullYear() - year) * ageFactor;

  // Calculate total rental rate per day
  const rentalRatePerDay = basePricePerDay + mileageRate + ageRate;

  return rentalRatePerDay.toFixed(0);
};

export const updateSearchParams = (type: string, value: string) => {
  // Get the current URL search params
  const searchParams = new URLSearchParams(window.location.search);

  // Set the specified search parameter to the given value
  searchParams.set(type, value);

  // Set the specified search parameter to the given value
  const newPathname = `${window.location.pathname}?${searchParams.toString()}`;

  return newPathname;
};

export const deleteSearchParams = (type: string) => {
  // Set the specified search parameter to the given value
  const newSearchParams = new URLSearchParams(window.location.search);

  // Delete the specified search parameter
  newSearchParams.delete(type.toLocaleLowerCase());

  // Construct the updated URL pathname with the deleted search parameter
  const newPathname = `${window.location.pathname}?${newSearchParams.toString()}`;

  return newPathname;
};

const filterCarsLocal = (cars: CarProps[], filters: FilterProps) => {
  const { manufacturer = "", model = "", fuel = "", year = 0, limit = 10 } = filters;
  const man = manufacturer.toLowerCase();
  const mdl = model.toLowerCase();
  const fl = fuel.toLowerCase();
  const yr = Number(year) || undefined;

  return cars
    .filter((c) => (
      (!man || c.make?.toLowerCase().includes(man)) &&
      (!mdl || c.model?.toLowerCase().includes(mdl)) &&
      (!fl || c.fuel_type?.toLowerCase() === fl) &&
      (!yr || c.year === yr)
    ))
    .slice(0, limit || 10);
};

export async function fetchCars(filters: FilterProps) {
  const { manufacturer = "", year = 2022, model = "", limit = 10, fuel = "" } = filters;

  const query = new URLSearchParams();
  if (manufacturer) query.set("manufacturer", manufacturer);
  if (model) query.set("model", model);
  if (fuel) query.set("fuel", fuel);
  if (year) query.set("year", String(year));
  query.set("limit", String(limit));

  const rapidKey = process.env.NEXT_PUBLIC_RAPID_API_KEY;
  try {
    if (rapidKey) {
      const headers: HeadersInit = {
        "X-RapidAPI-Key": rapidKey,
        "X-RapidAPI-Host": "cars-by-api-ninjas.p.rapidapi.com",
      };
      const response = await fetch(
        `https://cars-by-api-ninjas.p.rapidapi.com/v1/cars?make=${manufacturer}&year=${year}&model=${model}&limit=${limit}&fuel_type=${fuel}`,
        { headers }
      );
      if (!response.ok) throw new Error(`Primary API failed: ${response.status}`);
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching from primary API, trying fallback:", error);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const fallbackResponse = await fetch(`${baseUrl}/api/cars?${query.toString()}`);
    if (!fallbackResponse.ok) throw new Error(`Fallback API failed: ${fallbackResponse.status}`);
    return await fallbackResponse.json();
  } catch (err) {
    console.warn("Fallback API failed, using embedded local data:", err);
    return filterCarsLocal(localCars as CarProps[], { manufacturer, model, fuel, year, limit });
  }
}

export const generateCarImageUrl = (car: CarProps, angle?: string) => {
  const { make, model, year } = car;

  const customer = process.env.NEXT_PUBLIC_IMAGIN_API_KEY;
  const hasCustomer = !!customer && customer !== 'hrjavascript-mastery';

  // Fallback without API key: use Unsplash (no API token needed)
  if (!hasCustomer) {
    const query = encodeURIComponent(`${make} ${model} ${year} car`);
    return `https://source.unsplash.com/800x600/?${query}`;
  }

  const url = new URL("https://cdn.imagin.studio/getimage");
  url.searchParams.append('customer', customer!);
  url.searchParams.append('make', make);
  // Use full model name to better handle cases like "3 Series" or "Model 3"
  url.searchParams.append('modelFamily', model);
  url.searchParams.append('zoomType', 'fullscreen');
  url.searchParams.append('modelYear', `${year}`);
  if (angle) {
    url.searchParams.append('angle', `${angle}`);
  }

  return url.toString();
}
