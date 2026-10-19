import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, parse_qs

async def parse_music_url(url: str) -> dict:
    """
    YouTube 또는 YouTube Music URL을 입력받아 제목(title), 가수(singer), 썸네일(thumbnail)을 추출합니다.
    """
    # 1. music.youtube.com 주소라도 oEmbed 조회를 위해 표준 youtube.com 형식으로 변환 지원
    parsed = urlparse(url)
    video_id = parse_qs(parsed.query).get("v", [None])[0]
    target_url = f"https://www.youtube.com/watch?v={video_id}" if video_id else url

    # 2. YouTube 공식 oEmbed API 호출 (차단 위험이 없고 가장 빠름)
    oembed_url = f"https://www.youtube.com/oembed?url={target_url}&format=json"
    
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        try:
            res = await client.get(oembed_url)
            if res.status_code == 200:
                data = res.json()
                singer = data.get("author_name", "Unknown Artist")
                # 유튜브 뮤직 자동 생성 채널 뒤에 붙는 ' - Topic' 문자열 깔끔하게 제거
                singer = singer.replace(" - Topic", "").strip()
                
                return {
                    "title": data.get("title", "Unknown Title"),
                    "singer": singer,
                    "thumbnail": data.get("thumbnail_url", ""),
                    "url": url
                }
        except Exception:
            pass

        # 3. 만약 oEmbed가 지원되지 않는 기타 음원 링크라면 HTML OpenGraph(og:) 메타태그에서 직접 추출
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            page_res = await client.get(url, headers=headers)
            soup = BeautifulSoup(page_res.text, "html.parser")

            og_title = soup.find("meta", property="og:title")
            og_image = soup.find("meta", property="og:image")
            og_desc = soup.find("meta", property="og:description")

            return {
                "title": og_title["content"] if og_title else "Unknown Title",
                "singer": og_desc["content"] if og_desc else "Unknown Artist",
                "thumbnail": og_image["content"] if og_image else "",
                "url": url
            }
        except Exception:
            return {
                "title": "Unknown Title",
                "singer": "Unknown Artist",
                "thumbnail": "",
                "url": url
            }