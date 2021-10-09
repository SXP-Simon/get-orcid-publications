# Get ORCiD publications

This action retrieves the public publications from a ORCiD profile and generates a `yml` with them. A common application case for this action is to retrieve periodically the publications from ORCiD to maintain updated a user o research group website.

## Usage

```yaml
- name: Get ORCiD publications
  id: getOrcidPublications
  uses: TheAlbertDev/get-orcid-publications@v0.1.0
  with:
    orcidId: "0000-0001-5293-4487"
```

### Inputs

- `orcidId` **Required:** ORCiD id from which to obtain publications.
- `publicationsFilePath` Optional (default: './'): Relative path where the .yml file with the publications is geneated.
- `publicationsFileName` Optional (default: 'PUBLICATIONS'): Name of the .yml file with the publications (without the extension)

### Outputs

- `numberOfPublications`: Number of publications obtained.
- `filePath`: Path of the generated file.

## Example

```yaml
# The action is triggered on a push, manually from the Actions tab,
# and periodically every Sunday
on:
  push:
  workflow_dispatch:
  schedule:
    - cron: 0 0 * * 0

jobs:
  getPublications:
    runs-on: ubuntu-latest
    name: Get publications from ORCiD
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: Get ORCiD publications
        id: getOrcidPublications
        uses: TheAlbertDev/get-orcid-publications@v0.1.0
        with:
          # ORCiD id of the user (required)
          orcidId: "0000-0001-5293-4487"
          # Relative path where the publications file will be generated
          # (optional, default: './')
          publicationsFilePath: "publications/"
          # Filename without extension (optional, default: 'PUBLICATIONS')
          publicationsFileName: "pubs"
        # The action outputs the number of publications retrieved from ORCiD
        # and the FilenamePath of the generated file
      - name: Shows number of publication and FilePath
        run: echo "${{ steps.getOrcidPublications.outputs.numberOfPublications }} publications have been saved on ${{ steps.getOrcidPublications.outputs.filePath }}"
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
