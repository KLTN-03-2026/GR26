package com.smartfnb;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ShiftTemplateApiScratchTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "OWNER")
    public void testPost() throws Exception {
        String json = """
            {
                "name": "Ca sáng test",
                "startTime": {
                    "hour": 8,
                    "minute": 0,
                    "second": 0,
                    "nano": 0
                },
                "endTime": {
                    "hour": 12,
                    "minute": 0,
                    "second": 0,
                    "nano": 0
                },
                "minStaff": 2,
                "maxStaff": 5,
                "color": "#FF5733",
                "active": true
            }
        """;

        mockMvc.perform(post("/api/v1/shift-templates")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isCreated());
    }
}
