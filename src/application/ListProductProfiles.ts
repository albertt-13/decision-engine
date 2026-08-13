import type { ProductProfileRepository } from "../ports/ProductProfileRepository.js";
import type { ProductProfile } from "../domain/catalog/ProductProfile.js";

export class ListProductProfiles {
  constructor(private readonly profileRepo: ProductProfileRepository) {}

  execute(): Promise<ProductProfile[]> {
    return this.profileRepo.findAll();
  }
}
