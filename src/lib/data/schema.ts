import { CoMap, CoList, co, Account, Profile, ImageDefinition } from 'jazz-tools'

export class AppAccount extends Account {
  profile = co.ref(Profile) // Public User Profile
  root = co.ref(AppAccountRoot) // all user data, private by default

  migrate() {
    console.log('AppAccount migrate() called.') // Log at the beginning
    if (this.root === undefined) {
      console.log('AppAccount root is undefined, initializing.') // Log before initialization
      this.root = AppAccountRoot.create({
        itemImages: ListOfItemImages.create([]),
      })
    }
    console.log('AppAccount migrate() finished.') // Log at the end
  }
}

export class AppAccountRoot extends CoMap {
  itemImages = co.ref(ListOfItemImages) // List of user's item images
}

export class ItemImage extends CoMap {
  image = co.ref(ImageDefinition) // Use ImageDefinition for original product image
  dateAdded = co.Date
  dateUpdated = co.Date
}

export class ListOfItemImages extends CoList.Of(co.ref(ItemImage)) {}
