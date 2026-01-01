class Puck < Formula
  desc "NHL Terminal UI for real-time stats and game tracking"
  homepage "https://github.com/jones/nhl-tui"
  url "https://registry.npmjs.org/puck/-/puck-0.1.0.tgz"
  sha256 "6fc7d276a10b4196c85dc4ab71bc4e98e21927b06ac44b5884d44719fdf5d174"
  license "MIT"

  depends_on "bun"

  def install
    # npm tarball extracts to package/
    libexec.install Dir["package/*"]
    bin.install_symlink libexec/"dist/index.js" => "puck"
  end

  test do
    system bin/"puck", "--skip-version-check", "--help"
  end
end
